import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';

type DbCategory = Database['public']['Enums']['transaction_category'];

// Espejo del enum SQL. `satisfies` impide valores que no existen en la base de datos.
export const TRANSACTION_CATEGORIES = [
  'groceries',
  'restaurants',
  'transport',
  'housing',
  'utilities',
  'health',
  'sport',
  'leisure',
  'shopping',
  'subscriptions',
  'education',
  'travel',
  'gifts',
  'taxes',
  'salary',
  'other',
] as const satisfies readonly DbCategory[];

// Y este mapa impide olvidar alguno: si se añade una categoría en SQL y no aquí, deja de compilar.
export const CATEGORY_LABEL = {
  groceries: 'Supermercado',
  restaurants: 'Restaurantes',
  transport: 'Transporte',
  housing: 'Vivienda',
  utilities: 'Suministros',
  health: 'Salud',
  sport: 'Deporte',
  leisure: 'Ocio',
  shopping: 'Compras',
  subscriptions: 'Suscripciones',
  education: 'Formación',
  travel: 'Viajes',
  gifts: 'Regalos',
  taxes: 'Impuestos',
  salary: 'Nómina',
  other: 'Otros',
} satisfies Record<DbCategory, string>;

export const PAYMENT_METHODS = ['card', 'cash', 'transfer', 'bizum', 'other'] as const;

/**
 * Esquema de cara al modelo: permisivo (null donde no se lea) y sin restricciones numéricas,
 * que no todos los proveedores aplican igual. Las reglas estrictas van después, en el dominio.
 */
export const TicketExtractionSchema = z.object({
  merchant: z
    .string()
    .nullable()
    .describe('Nombre comercial del establecimiento tal como figura, p. ej. "Mercadona". null si no se lee.'),
  merchantTaxId: z.string().nullable().describe('NIF o CIF del comercio si aparece; si no, null.'),
  issuedAt: z
    .string()
    .nullable()
    .describe('Fecha y hora del ticket, hora local, formato YYYY-MM-DDTHH:mm. Sin hora: T00:00. null si no se lee.'),
  currency: z.string().describe('Código ISO 4217 en mayúsculas. EUR si no se indica.'),
  total: z.number().describe('Importe total pagado, con IVA incluido.'),
  category: z
    .enum(TRANSACTION_CATEGORIES)
    .describe('Categoría de gasto más probable según el comercio y los artículos.'),
  paymentMethod: z
    .enum(PAYMENT_METHODS)
    .nullable()
    .describe('Medio de pago si figura (tarjeta, efectivo…); si no, null.'),
  vat: z
    .array(
      z.object({
        ratePct: z.number().describe('Tipo de IVA en porcentaje: 21, 10, 4 u otro que figure.'),
        base: z.number().describe('Base imponible de ese tipo.'),
        amount: z.number().describe('Cuota de IVA de ese tipo.'),
      }),
    )
    .describe('Desglose de IVA por tipo, tal como figura en el ticket. Vacío si no aparece.'),
  lineItems: z
    .array(z.object({ description: z.string(), quantity: z.number().nullable(), total: z.number() }))
    .describe('Líneas del ticket, como máximo 60.'),
  confidence: z.number().describe('Confianza global entre 0 y 1 en la lectura del total y la fecha.'),
  warnings: z
    .array(z.string())
    .describe('Problemas detectados: ticket cortado, borroso, varios tickets, no es un ticket…'),
});

export type TicketExtraction = z.infer<typeof TicketExtractionSchema>;
