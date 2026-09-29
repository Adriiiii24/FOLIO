import { describe, expect, it } from 'vitest';
import {
  describeItems,
  dishIngredients,
  fromMealItems,
  hasCatalogItems,
  itemValues,
  matchFromRow,
  parseAmount,
  toMealItems,
  totals,
  type ComposedItem,
} from '@/modules/nutrition/items';

// Valores por 100 g de CIQUAL (supabase/data/ciqual-2025-es.csv).
const pollo: ComposedItem = {
  kind: 'food',
  key: 'a',
  foodId: 36018,
  name: 'Pollo, pechuga sin piel, a la plancha',
  category: 'Carne cocinada',
  per: { kcal: 141, proteinG: 30.1, carbsG: 0, fatG: 2 },
  amount: '150',
};
const arroz: ComposedItem = {
  kind: 'food',
  key: 'b',
  foodId: 9104,
  name: 'Arroz blanco, cocido, sin sal añadida',
  category: 'Pasta, arroz y cereales',
  per: { kcal: 155, proteinG: 3.15, carbsG: 33.2, fatG: 0.7 },
  amount: '200',
};
const lentejas: ComposedItem = {
  kind: 'dish',
  key: 'c',
  dishId: '0b7e4f1a-2c3d-4e5f-8a9b-0c1d2e3f4a5b',
  name: 'Lentejas de casa',
  servingGrams: 210,
  per: { kcal: 340, proteinG: 20.2, carbsG: 32.4, fatG: 11.1 },
  amount: '1,5',
};

describe('cantidades', () => {
  it('lee comas, puntos y espacios; lo que no es positivo cuenta como 0', () => {
    expect(parseAmount('1,5')).toBe(1.5);
    expect(parseAmount(' 80 ')).toBe(80);
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('-3')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
  });

  it('los gramos escalan los valores por 100 g', () => {
    expect(itemValues(pollo)).toEqual({ grams: 150, kcal: 212, proteinG: 45.2, carbsG: 0, fatG: 3 });
  });

  it('las raciones escalan los valores del plato', () => {
    expect(itemValues(lentejas)).toEqual({ grams: 315, kcal: 510, proteinG: 30.3, carbsG: 48.6, fatG: 16.7 });
  });

  it('los totales suman lo que se ve en cada fila', () => {
    expect(totals([pollo, arroz])).toEqual({ kcal: 522, proteinG: 51.5, carbsG: 66.4, fatG: 4.4 });
    expect(totals([])).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });
});

describe('descripción', () => {
  it('con un alimento, su nombre entero', () => {
    expect(describeItems([pollo])).toBe('Pollo, pechuga sin piel, a la plancha');
  });

  it('con varios, la primera parte de cada nombre en una frase', () => {
    expect(describeItems([pollo, arroz, { name: 'Aceite de oliva virgen extra' }])).toBe(
      'Pollo, arroz blanco y aceite de oliva virgen extra',
    );
  });

  it('sin alimentos, vacía', () => {
    expect(describeItems([])).toBe('');
  });
});

describe('guardar y editar', () => {
  it('ida y vuelta: lo guardado vuelve a ser la misma lista', () => {
    const stored = toMealItems([pollo, lentejas]);
    expect(stored).toEqual([
      {
        name: pollo.name,
        grams: 150,
        caloriesKcal: 212,
        proteinG: 45.2,
        carbsG: 0,
        fatG: 3,
        foodId: 36018,
      },
      {
        name: 'Lentejas de casa',
        grams: 315,
        caloriesKcal: 510,
        proteinG: 30.3,
        carbsG: 48.6,
        fatG: 16.7,
        dishId: lentejas.kind === 'dish' ? lentejas.dishId : '',
        servings: 1.5,
      },
    ]);
    const restored = fromMealItems(stored);
    expect(restored.map((item) => item.amount)).toEqual(['150', '1,5']);
    expect(totals(restored)).toEqual(totals([pollo, lentejas]));
  });

  it('las filas sin cantidad no se guardan', () => {
    expect(toMealItems([{ ...pollo, amount: '' }])).toEqual([]);
  });

  it('los alimentos que estimó la IA no entran en la lista ni cuentan como del catálogo', () => {
    const estimated = [{ name: 'arroz', estimatedGrams: 150, caloriesKcal: 195, proteinG: 4, carbsG: 42, fatG: 1 }];
    expect(fromMealItems(estimated)).toEqual([]);
    expect(hasCatalogItems(estimated)).toBe(false);
    expect(hasCatalogItems(toMealItems([pollo]))).toBe(true);
    expect(hasCatalogItems([])).toBe(false);
  });
});

describe('platos', () => {
  it('solo alimentos con gramos, y cada alimento una vez', () => {
    expect(
      dishIngredients([
        pollo,
        arroz,
        { ...pollo, key: 'd', amount: '50' },
        lentejas,
        { ...arroz, key: 'e', amount: '' },
      ]),
    ).toEqual([
      { foodId: 36018, grams: 200 },
      { foodId: 9104, grams: 200 },
    ]);
  });
});

describe('resultados de search_foods', () => {
  const row = {
    kind: 'food',
    food_id: 36018,
    dish_id: null as unknown as string,
    name: pollo.name,
    category: 'Carne cocinada',
    grams: 100,
    kcal: 141,
    protein_g: 30.1,
    carbs_g: 0,
    fat_g: 2,
  };

  it('un alimento trae su id de alimento', () => {
    expect(matchFromRow(row)).toMatchObject({ kind: 'food', foodId: 36018, per: { kcal: 141 } });
  });

  it('un plato trae su id de plato y los gramos de una ración', () => {
    const dish = { ...row, kind: 'dish', food_id: null as unknown as number, dish_id: 'x', grams: 210 };
    expect(matchFromRow(dish)).toMatchObject({ kind: 'dish', dishId: 'x', servingGrams: 210 });
  });

  it('una fila incoherente se descarta', () => {
    expect(matchFromRow({ ...row, food_id: null as unknown as number })).toBeNull();
  });
});
