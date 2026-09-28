import { z } from 'zod';
import { PAYMENT_METHODS, TRANSACTION_CATEGORIES } from '@/lib/ai/schemas/ticket';

const money = z
  .number()
  .positive()
  .max(1_000_000)
  .transform((value) => Math.round(value * 100) / 100);

/** Esquema de dominio: estricto. Valida lo que se guarda, venga de un formulario o de un borrador de IA. */
export const TransactionInputSchema = z.object({
  kind: z.enum(['expense', 'income']).default('expense'),
  amount: money,
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default('EUR'),
  category: z.enum(TRANSACTION_CATEGORIES),
  merchant: z.string().trim().max(120).nullable(),
  description: z.string().trim().max(500).nullable().default(null),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable(),
  occurredAt: z.iso.datetime(),
  taxAmount: z.number().min(0).nullable().default(null),
  taxBreakdown: z
    .array(z.object({ ratePct: z.number().min(0).max(100), base: z.number(), amount: z.number() }))
    .nullable()
    .default(null),
  receiptPath: z.string().nullable().default(null),
  source: z.enum(['manual', 'ocr', 'voice']),
  aiConfidence: z.number().min(0).max(1).nullable().default(null),
  rawExtraction: z.unknown().optional(),
});

export type TransactionInput = z.input<typeof TransactionInputSchema>;
