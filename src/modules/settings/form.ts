import { z } from 'zod';
import { checkbox, num, optionalNumber, optionalText, requiredNumber } from '@/lib/form-schemas';

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('es-ES', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const ProfileFormSchema = z.object({
  displayName: optionalText(80),
  timezone: z.string().refine(isValidTimeZone, 'Zona horaria no válida.'),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Código de moneda de tres letras, como EUR.'),
});

const int = (min: number, max: number, unit: string) =>
  optionalNumber(
    num().int(`Número entero de ${unit}.`).min(min, `Entre ${min} y ${max}.`).max(max, `Entre ${min} y ${max}.`),
  );

export const TargetsFormSchema = z.object({
  dailyKcalTarget: int(800, 8000, 'kcal'),
  dailyProteinGTarget: int(0, 500, 'gramos'),
  dailyCarbsGTarget: int(0, 1000, 'gramos'),
  dailyFatGTarget: int(0, 400, 'gramos'),
  monthlyBudget: optionalNumber(num().min(0, 'No puede ser negativo.').max(1_000_000, 'Demasiado alto.')),
});

export const AiFormSchema = z.object({
  aiMonthlyBudgetUsd: requiredNumber(
    num('Escribe el presupuesto (0 desactiva la IA).').min(0, 'Entre 0 y 1000.').max(1000, 'Entre 0 y 1000.'),
  ),
  briefingEnabled: checkbox,
});

/** Palabra que hay que escribir para borrar la cuenta: una confirmación que no se da por accidente. */
export const DELETE_CONFIRMATION = 'BORRAR';
