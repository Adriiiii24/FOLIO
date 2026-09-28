import { z } from 'zod';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

/** Macros por alimento. Los totales NO los da el modelo: se suman en el dominio (meal-rules.ts). */
export const MealExtractionSchema = z.object({
  description: z
    .string()
    .describe('Descripción breve del plato en español, p. ej. "Pechuga de pollo con arroz y brócoli".'),
  mealType: z.enum(MEAL_TYPES).nullable().describe('Tipo de comida si se deduce del contexto; si no, null.'),
  items: z
    .array(
      z.object({
        name: z.string().describe('Alimento identificado.'),
        estimatedGrams: z.number().describe('Porción estimada en gramos.'),
        caloriesKcal: z.number().describe('Calorías de la porción (kcal).'),
        proteinG: z.number().describe('Proteínas de la porción (g).'),
        carbsG: z.number().describe('Carbohidratos de la porción (g).'),
        fatG: z.number().describe('Grasas de la porción (g).'),
      }),
    )
    .describe('Un elemento por alimento visible.'),
  hiddenCaloriesNote: z
    .string()
    .nullable()
    .describe('Fuentes probables no visibles (aceite, salsas) y su efecto en la estimación; null si no aplica.'),
  confidence: z.number().describe('Confianza entre 0 y 1 en la estimación de las porciones.'),
  warnings: z.array(z.string()).describe('Problemas: foto borrosa, plato parcialmente visible, no es comida…'),
});

export type MealExtraction = z.infer<typeof MealExtractionSchema>;
