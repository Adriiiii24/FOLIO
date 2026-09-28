import { z } from 'zod';
import { PAYMENT_METHODS, TRANSACTION_CATEGORIES } from '@/lib/ai/schemas/ticket';
import { localDateTime, num, optionalEnum, optionalId, optionalText, requiredNumber } from '@/lib/form-schemas';

/** Lo que llega del formulario de movimientos (y del borrador de la barra de entrada). */
export const TransactionFormSchema = z.object({
  id: optionalId,
  kind: z.enum(['expense', 'income'], { error: 'Elige gasto o ingreso.' }),
  amount: requiredNumber(
    num('Escribe el importe.')
      .positive('El importe tiene que ser mayor que 0.')
      .max(1_000_000, 'Importe demasiado alto.'),
  ),
  category: z.enum(TRANSACTION_CATEGORIES, { error: 'Elige una categoría.' }),
  merchant: optionalText(120),
  description: optionalText(500),
  paymentMethod: optionalEnum(PAYMENT_METHODS),
  occurredAt: localDateTime,
});

export type TransactionFormValues = {
  id?: string;
  kind: 'expense' | 'income';
  amount: string;
  category: (typeof TRANSACTION_CATEGORIES)[number];
  merchant: string;
  description: string;
  paymentMethod: string;
  occurredAt: string;
};
