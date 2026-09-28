import { z } from 'zod';

/** {user_id}/{uuid}.{ext}: la ruta la genera el navegador al subir; se valida aquí y otra vez en SQL. */
export const STORAGE_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png|webm|m4a|mp4|ogg)$/;

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Lo que un borrador de IA añade a un registro: origen, archivo, confianza y la extracción original.
 * Viaja en el campo oculto `ai` del formulario del borrador. Es metadato de la propia persona (RLS
 * impide escribirlo en filas ajenas); aun así se valida entero antes de guardarlo.
 */
export const AiMetaSchema = z.object({
  source: z.enum(['ocr', 'photo', 'voice']),
  path: z.string().regex(STORAGE_PATH).nullable(),
  confidence: z.number().min(0).max(1).transform(round2).nullable(),
  durationS: z.number().int().min(0).max(600).nullable().default(null),
  taxAmount: z.number().min(0).max(1_000_000).transform(round2).nullable().default(null),
  taxBreakdown: z
    .array(z.object({ ratePct: z.number().min(0).max(100), base: z.number(), amount: z.number() }))
    .max(10)
    .nullable()
    .default(null),
  items: z
    .array(
      z.object({
        name: z.string().max(120),
        estimatedGrams: z.number().min(0).max(5000),
        caloriesKcal: z.number().min(0).max(10_000),
        proteinG: z.number().min(0).max(2000),
        carbsG: z.number().min(0).max(2000),
        fatG: z.number().min(0).max(2000),
      }),
    )
    .max(40)
    .nullable()
    .default(null),
  raw: z.unknown().optional(),
});

export type AiMetaInput = z.input<typeof AiMetaSchema>;
export type AiMeta = z.output<typeof AiMetaSchema>;

/** Tope al JSON del campo oculto: la extracción original de un ticket largo cabe con holgura. */
const MAX_META_CHARS = 100_000;

/**
 * `null` si el formulario no trae metadato (alta manual); `'invalid'` si lo trae y no es válido o su
 * archivo no está en la carpeta de quien guarda.
 */
export function parseAiMeta(value: FormDataEntryValue | null, userId: string): AiMeta | null | 'invalid' {
  if (typeof value !== 'string' || value === '') return null;
  if (value.length > MAX_META_CHARS) return 'invalid';
  let json: unknown;
  try {
    json = JSON.parse(value);
  } catch {
    return 'invalid';
  }
  const parsed = AiMetaSchema.safeParse(json);
  if (!parsed.success) return 'invalid';
  if (parsed.data.path && !parsed.data.path.startsWith(`${userId}/`)) return 'invalid';
  return parsed.data;
}
