import { z } from 'zod';
import { num, optionalId, optionalIsoDate, optionalNumber, optionalText, requiredText } from '@/lib/form-schemas';

export const MEDIA_KIND_OPTIONS = [
  { value: 'book', label: 'Libro' },
  { value: 'film', label: 'Película' },
  { value: 'series', label: 'Serie' },
  { value: 'podcast', label: 'Pódcast' },
  { value: 'game', label: 'Videojuego' },
  { value: 'album', label: 'Disco' },
] as const;

export const MEDIA_STATUS_OPTIONS = [
  { value: 'backlog', label: 'Pendiente' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'done', label: 'Terminado' },
  { value: 'dropped', label: 'Abandonado' },
] as const;

export const MEDIA_KIND_LABEL: Record<string, string> = Object.fromEntries(
  MEDIA_KIND_OPTIONS.map((option) => [option.value, option.label]),
);
export const MEDIA_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  MEDIA_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

export const MediaFormSchema = z
  .object({
    id: optionalId,
    kind: z.enum(['book', 'film', 'series', 'podcast', 'game', 'album'], { error: 'Elige el tipo.' }),
    title: requiredText(200, 'Escribe el título.'),
    creator: optionalText(200),
    status: z.enum(['backlog', 'in_progress', 'done', 'dropped'], { error: 'Elige el estado.' }),
    rating: optionalNumber(num().int('Nota entera.').min(1, 'Del 1 al 10.').max(10, 'Del 1 al 10.')),
    progressPct: optionalNumber(num().int().min(0, 'Entre 0 y 100.').max(100, 'Entre 0 y 100.')),
    startedOn: optionalIsoDate,
    finishedOn: optionalIsoDate,
    review: optionalText(5000),
  })
  .refine((value) => !value.startedOn || !value.finishedOn || value.finishedOn >= value.startedOn, {
    path: ['finishedOn'],
    message: 'La fecha de fin no puede ser anterior a la de inicio.',
  });
