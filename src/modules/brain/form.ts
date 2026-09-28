import { z } from 'zod';
import { isoDate, num, optionalId, optionalNumber, optionalText, requiredText } from '@/lib/form-schemas';

/** «Trabajo, Rodilla ,  trabajo» → ['trabajo', 'rodilla']: minúsculas, sin #, sin repetir. */
export function parseTags(value: string): string[] {
  const tags = value
    .split(/[,\n]/)
    .map((tag) => tag.trim().replace(/^#/, '').toLocaleLowerCase('es'))
    .filter(Boolean);
  return [...new Set(tags)];
}

export const NoteFormSchema = z.object({
  id: optionalId,
  entryDate: isoDate,
  title: optionalText(160),
  content: requiredText(20000, 'Escribe algo en la entrada.'),
  mood: optionalNumber(num().int().min(1, 'Del 1 al 5.').max(5, 'Del 1 al 5.')),
  tags: z
    .string()
    .default('')
    .transform(parseTags)
    .pipe(
      z.array(z.string().max(40, 'Cada etiqueta, 40 caracteres como máximo.')).max(20, 'Como máximo 20 etiquetas.'),
    ),
});

export const MOOD_LABEL: Record<number, string> = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Normal', 4: 'Bien', 5: 'Muy bien' };
