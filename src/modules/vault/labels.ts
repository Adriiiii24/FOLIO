import type { Database } from '@/lib/supabase/database.types';
import { CATEGORY_LABEL, PAYMENT_METHODS, TRANSACTION_CATEGORIES } from '@/lib/ai/schemas/ticket';

type PaymentMethod = Database['public']['Enums']['payment_method'];

export const PAYMENT_LABEL = {
  card: 'Tarjeta',
  cash: 'Efectivo',
  transfer: 'Transferencia',
  bizum: 'Bizum',
  other: 'Otro',
} satisfies Record<PaymentMethod, string>;

export const CATEGORY_OPTIONS = TRANSACTION_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABEL[value] }));
export const PAYMENT_OPTIONS = [
  { value: '', label: 'Sin indicar' },
  ...PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_LABEL[value] })),
];
export const KIND_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
] as const;

export { CATEGORY_LABEL };
