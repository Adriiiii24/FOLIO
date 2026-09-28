import { z } from 'zod';
import { num, optionalId, optionalText, requiredNumber, requiredText } from '@/lib/form-schemas';

export const CADENCE_OPTIONS = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
] as const;

export const HabitFormSchema = z.object({
  id: optionalId,
  name: requiredText(60, 'Ponle nombre al hábito.'),
  cadence: z.enum(['daily', 'weekly'], { error: 'Elige diario o semanal.' }),
  targetPerPeriod: requiredNumber(num('Escribe el objetivo.').int().min(1, 'Entre 1 y 14.').max(14, 'Entre 1 y 14.')),
});

export const FocusFormSchema = z.object({
  label: optionalText(80),
  plannedMinutes: requiredNumber(
    num('Escribe los minutos.').int().min(1, 'Entre 1 y 240 minutos.').max(240, 'Entre 1 y 240 minutos.'),
  ),
});

/** Comparación de nombres de hábito sin mayúsculas ni tildes: «Meditar» = «meditar» = «MEDITÁR». */
export function sameHabitName(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLocaleLowerCase('es');
  return normalize(a) === normalize(b);
}
