import { z } from 'zod';
import { localDateTime, num, optionalId, requiredNumber, requiredText } from '@/lib/form-schemas';

export const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Comida' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Picoteo' },
] as const;

export const MEAL_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  MEAL_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const grams = (label: string) =>
  requiredNumber(
    num(`Escribe los gramos de ${label} (0 si no hay).`).min(0, 'No puede ser negativo.').max(2000, 'Demasiado alto.'),
  );

export const MealFormSchema = z.object({
  id: optionalId,
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], { error: 'Elige el tipo de comida.' }),
  description: requiredText(300, 'Describe lo que has comido.'),
  caloriesKcal: requiredNumber(
    num('Escribe las kcal.').int('Kcal enteras.').min(0, 'Entre 0 y 10.000.').max(10000, 'Entre 0 y 10.000.'),
  ),
  proteinG: grams('proteína'),
  carbsG: grams('carbohidratos'),
  fatG: grams('grasa'),
  eatenAt: localDateTime,
});

/** Tipo de comida probable según la hora local: el valor por defecto del formulario y del borrador. */
export function mealTypeForHour(hour: number): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 12 && hour < 16) return 'lunch';
  if (hour >= 20 || hour < 2) return 'dinner';
  return 'snack';
}

/**
 * Coherencia energética (Atwater, 4/4/9 kcal por gramo). No rechaza: avisa si la diferencia con las kcal
 * escritas supera el 15 %.
 */
export function atwaterWarning(kcal: number, protein: number, carbs: number, fat: number): string | null {
  const computed = 4 * protein + 4 * carbs + 9 * fat;
  if (kcal <= 0 || computed <= 0) return null;
  const deviation = Math.abs(kcal - computed) / kcal;
  return deviation > 0.15
    ? `Las kcal no cuadran con los macros: ${Math.round(computed)} kcal según proteína, carbohidratos y grasa (${Math.round(deviation * 100)} % de diferencia).`
    : null;
}
