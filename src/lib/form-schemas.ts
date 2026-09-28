import { z } from 'zod';

// Piezas Zod para campos de formulario: lo que llega de un <form> son cadenas, y aquí se convierten
// en el tipo que espera la base de datos. Los mensajes son los que verá la persona.

// Un campo AUSENTE del FormData (el `id` de un alta, un campo que un borrador no pinta) vale lo mismo que
// uno vacío. Sin esto, Zod recibe undefined y rechaza el alta con «Revisa los campos marcados».
const blankToNull = (value: unknown) =>
  value === undefined || (typeof value === 'string' && value.trim() === '') ? null : value;

/** «12,40», «12.40» y « 12 » son números; una cadena vacía es null. */
const toNumber = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const clean = value.trim().replace(/\s/g, '').replace(',', '.');
  return clean === '' ? null : Number(clean);
};

export const requiredText = (max: number, message = 'Este campo es obligatorio.') =>
  z.string().trim().min(1, message).max(max, `Máximo ${max} caracteres.`);

export const optionalText = (max: number) =>
  z.preprocess(blankToNull, z.string().trim().max(max, `Máximo ${max} caracteres.`).nullable());

export const requiredNumber = (schema: z.ZodNumber) => z.preprocess(toNumber, schema);

export const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((value) => (value === undefined ? null : toNumber(value)), schema.nullable());

export const num = (message = 'Escribe un número.') => z.number({ error: message });

export const optionalId = z.preprocess(blankToNull, z.uuid().nullable());

export const optionalEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(blankToNull, z.enum(values).nullable());

export const isoDate = z.iso.date({ error: 'Elige una fecha.' });

export const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Elige fecha y hora.');

export const optionalIsoDate = z.preprocess(blankToNull, z.iso.date({ error: 'Fecha no válida.' }).nullable());

/** Casillas de un formulario: presentes y distintas de «off» significan sí. */
export const checkbox = z.preprocess((value) => value === 'on' || value === 'true', z.boolean());
