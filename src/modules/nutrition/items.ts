import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';

// Alimentos de una comida registrada con el catálogo (05 // NUTRICIÓN): la lista que se compone en el
// formulario, sus totales y cómo se guarda en `macros.items`. Sin 'server-only': lo usan el formulario
// (cliente) y la acción (servidor).

export type Macros = { kcal: number; proteinG: number; carbsG: number; fatG: number };

/** Un resultado de `search_foods`: un alimento (valores por 100 g) o un plato propio (por ración). */
export type FoodMatch =
  | { kind: 'food'; foodId: number; name: string; category: string; per: Macros }
  | { kind: 'dish'; dishId: string; name: string; servingGrams: number; per: Macros };

/** Una fila de la lista: la cantidad es texto porque es lo que se escribe («150», «1,5»). */
export type ComposedItem = FoodMatch & { key: string; amount: string };

/** Lo que se guarda por alimento en `macros.items`. */
export const MealItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  grams: z.number().min(0).max(5000),
  caloriesKcal: z.number().min(0).max(10_000),
  proteinG: z.number().min(0).max(2000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(2000),
  foodId: z.number().int().positive().optional(),
  dishId: z.uuid().optional(),
  servings: z.number().positive().max(50).optional(),
});

export const MealItemsSchema = z.array(MealItemSchema).max(40);
export type MealItem = z.infer<typeof MealItemSchema>;

const round1 = (value: number) => Math.round(value * 10) / 10;

/** «150», «1,5» o « 80 » a número; lo que no es un número positivo cuenta como 0. */
export function parseAmount(text: string): number {
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Gramos y macros de una fila: los gramos escalan los valores por 100 g; las raciones, los del plato. */
export function itemValues(item: ComposedItem): { grams: number } & Macros {
  const amount = parseAmount(item.amount);
  const factor = item.kind === 'food' ? amount / 100 : amount;
  const grams = item.kind === 'food' ? amount : amount * item.servingGrams;
  return {
    grams: Math.round(grams),
    kcal: Math.round(item.per.kcal * factor),
    proteinG: round1(item.per.proteinG * factor),
    carbsG: round1(item.per.carbsG * factor),
    fatG: round1(item.per.fatG * factor),
  };
}

/** Totales de la lista. Se suman los valores de cada fila ya redondeados: cuadran con lo que se ve. */
export function totals(items: readonly ComposedItem[]): Macros {
  return items.reduce<Macros>(
    (sum, item) => {
      const values = itemValues(item);
      return {
        kcal: sum.kcal + values.kcal,
        proteinG: round1(sum.proteinG + values.proteinG),
        carbsG: round1(sum.carbsG + values.carbsG),
        fatG: round1(sum.fatG + values.fatG),
      };
    },
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

/** Lo que se guarda en `macros.items`. Las filas sin cantidad no cuentan. */
export function toMealItems(items: readonly ComposedItem[]): MealItem[] {
  return items.flatMap((item): MealItem[] => {
    const { grams, kcal, proteinG, carbsG, fatG } = itemValues(item);
    if (grams <= 0) return [];
    const base = { name: item.name, grams, caloriesKcal: kcal, proteinG, carbsG, fatG };
    return item.kind === 'food'
      ? [{ ...base, foodId: item.foodId }]
      : [{ ...base, dishId: item.dishId, servings: parseAmount(item.amount) }];
  });
}

/**
 * Filas de la lista a partir de lo guardado, para editar una comida. Solo las del catálogo: los
 * alimentos que estimó la IA a partir de una foto no tienen valores de referencia y se dejan como están.
 */
export function fromMealItems(stored: unknown): ComposedItem[] {
  const parsed = MealItemsSchema.safeParse(stored);
  if (!parsed.success) return [];
  return parsed.data.flatMap((item, index): ComposedItem[] => {
    const key = `guardado-${index}`;
    if (item.foodId !== undefined && item.grams > 0) {
      const factor = 100 / item.grams;
      return [
        {
          kind: 'food',
          key,
          foodId: item.foodId,
          name: item.name,
          category: '',
          per: scale(item, factor),
          amount: decimal(item.grams),
        },
      ];
    }
    if (item.dishId !== undefined && item.servings) {
      const factor = 1 / item.servings;
      return [
        {
          kind: 'dish',
          key,
          dishId: item.dishId,
          name: item.name,
          servingGrams: item.grams * factor,
          per: scale(item, factor),
          amount: decimal(item.servings),
        },
      ];
    }
    return [];
  });
}

function scale(item: MealItem, factor: number): Macros {
  return {
    kcal: item.caloriesKcal * factor,
    proteinG: item.proteinG * factor,
    carbsG: item.carbsG * factor,
    fatG: item.fatG * factor,
  };
}

/** Un número como se escribe en español: «1,5». */
export const decimal = (value: number) => String(round1(value)).replace('.', ',');

/** ¿La comida lleva alimentos del catálogo? Sus kcal siguen la norma europea y no tienen por qué cuadrar con Atwater. */
export function hasCatalogItems(stored: unknown): boolean {
  const parsed = MealItemsSchema.safeParse(stored);
  return parsed.success && parsed.data.some((item) => item.foodId !== undefined || item.dishId !== undefined);
}

/**
 * Descripción de la comida a partir de la lista: con una fila, su nombre; con varias, la primera parte de
 * cada nombre («Pollo, pechuga sin piel…» → «pollo»), unidas en una frase: «Pollo, arroz blanco y aceite de oliva».
 */
export function describeItems(items: readonly Pick<ComposedItem, 'name'>[]): string {
  const [first] = items;
  if (!first) return '';
  if (items.length === 1) return first.name.slice(0, 300);
  const parts = items.map((item, index) => {
    const head = item.name.split(',')[0]!.trim();
    return index === 0 ? head : head.charAt(0).toLocaleLowerCase('es') + head.slice(1);
  });
  const sentence = `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
  return sentence.slice(0, 300);
}

export const DishFormSchema = z.object({
  name: z.string().trim().min(1, 'Ponle un nombre al plato.').max(120, 'Máximo 120 caracteres.'),
  servings: z
    .number({ error: 'Escribe cuántas raciones salen.' })
    .int('Raciones enteras.')
    .min(1, 'Entre 1 y 20 raciones.')
    .max(20, 'Entre 1 y 20 raciones.'),
  items: z
    .array(z.object({ foodId: z.number().int().positive(), grams: z.number().positive().max(5000) }))
    .min(1, 'Añade al menos un alimento.')
    .max(40, 'Un plato lleva 40 alimentos como máximo.'),
});
export type DishInput = z.input<typeof DishFormSchema>;

/** Ingredientes de un plato: solo alimentos con gramos, y cada alimento una vez (se suman sus gramos). */
export function dishIngredients(items: readonly ComposedItem[]): DishInput['items'] {
  const grams = new Map<number, number>();
  for (const item of items) {
    if (item.kind !== 'food') continue;
    const amount = parseAmount(item.amount);
    if (amount > 0) grams.set(item.foodId, (grams.get(item.foodId) ?? 0) + amount);
  }
  return [...grams].map(([foodId, total]) => ({ foodId, grams: round1(total) }));
}

type DishRow = {
  id: string;
  name: string;
  servings: number;
  dish_items: { grams: number; foods: { kcal: number; protein_g: number; carbs_g: number; fat_g: number } | null }[];
};

/** Un plato guardado como resultado de búsqueda: gramos y macros de una ración, como `search_foods`. */
export function dishMatch(row: DishRow): Extract<FoodMatch, { kind: 'dish' }> {
  const sum = row.dish_items.reduce(
    (acc, item) => {
      const food = item.foods;
      const factor = Number(item.grams) / 100;
      return {
        grams: acc.grams + Number(item.grams),
        kcal: acc.kcal + Number(food?.kcal ?? 0) * factor,
        proteinG: acc.proteinG + Number(food?.protein_g ?? 0) * factor,
        carbsG: acc.carbsG + Number(food?.carbs_g ?? 0) * factor,
        fatG: acc.fatG + Number(food?.fat_g ?? 0) * factor,
      };
    },
    { grams: 0, kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  const servings = Math.max(1, row.servings);
  return {
    kind: 'dish',
    dishId: row.id,
    name: row.name,
    servingGrams: Math.round(sum.grams / servings),
    per: {
      kcal: Math.round(sum.kcal / servings),
      proteinG: round1(sum.proteinG / servings),
      carbsG: round1(sum.carbsG / servings),
      fatG: round1(sum.fatG / servings),
    },
  };
}

/** Columnas para `dishMatch`: el plato con sus ingredientes y los valores de cada alimento. */
export const DISH_SELECT = 'id, name, servings, dish_items(grams, foods(kcal, protein_g, carbs_g, fat_g))';

type SearchRow = Database['public']['Functions']['search_foods']['Returns'][number];

/**
 * Una fila de `search_foods` como resultado tipado. Los tipos generados no marcan `food_id` ni `dish_id`
 * como anulables, pero cada fila trae solo uno de los dos: se comprueba aquí.
 */
export function matchFromRow(row: SearchRow): FoodMatch | null {
  const per = {
    kcal: Number(row.kcal),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
  };
  if (row.kind === 'dish' && typeof row.dish_id === 'string') {
    return { kind: 'dish', dishId: row.dish_id, name: row.name, servingGrams: Number(row.grams), per };
  }
  if (row.kind === 'food' && typeof row.food_id === 'number') {
    return { kind: 'food', foodId: row.food_id, name: row.name, category: row.category, per };
  }
  return null;
}
