import { z } from 'zod';
import {
  checkbox,
  localDateTime,
  num,
  optionalId,
  optionalNumber,
  optionalText,
  requiredNumber,
  requiredText,
} from '@/lib/form-schemas';

export const WorkoutFormSchema = z.object({
  id: optionalId,
  title: requiredText(80, 'Ponle nombre a la sesión.'),
  startedAt: localDateTime,
  perceivedEffort: optionalNumber(num().int('Del 1 al 10.').min(1, 'Del 1 al 10.').max(10, 'Del 1 al 10.')),
  notes: optionalText(2000),
});

export const SetFormSchema = z.object({
  workoutId: z.uuid({ error: 'Empieza una sesión primero.' }),
  exercise: requiredText(80, 'Escribe el ejercicio.'),
  reps: requiredNumber(
    num('Escribe las repeticiones.').int('Repeticiones enteras.').min(0, 'Entre 0 y 200.').max(200, 'Entre 0 y 200.'),
  ),
  weightKg: requiredNumber(
    num('Escribe el peso (0 si es sin carga).').min(0, 'Entre 0 y 1000 kg.').max(1000, 'Entre 0 y 1000 kg.'),
  ),
  rpe: optionalNumber(num().min(1, 'RPE entre 1 y 10.').max(10, 'RPE entre 1 y 10.')),
  isWarmup: checkbox,
  count: requiredNumber(num().int().min(1, 'Entre 1 y 20 series.').max(20, 'Entre 1 y 20 series.')),
});

/** Borrador de la barra de entrada: «press banca 4x8 a 80». La sesión la resuelve la acción. */
export const QuickSetsFormSchema = SetFormSchema.omit({ workoutId: true });

/** 1RM estimado (Epley): peso × (1 + reps / 30). */
export function epley(weightKg: number, reps: number): number {
  return reps > 0 ? weightKg * (1 + reps / 30) : 0;
}
