'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { zonedToUtcIso } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/modules/settings/queries';
import { TransactionFormSchema } from './form';
import { TransactionInputSchema } from './schemas';

function revalidate() {
  revalidatePath('/vault');
  revalidatePath('/home');
}

/** Crea o actualiza un movimiento. El formulario valida la forma; TransactionInputSchema, el dominio. */
export async function saveTransaction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = TransactionFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, occurredAt, ...values } = parsed.data;

  const profile = await getProfile();
  const domain = TransactionInputSchema.safeParse({
    ...values,
    currency: profile.currency,
    occurredAt: zonedToUtcIso(occurredAt, profile.timezone),
    source: 'manual',
  });
  if (!domain.success) return fromZod(domain.error);
  const input = domain.data;

  const row = {
    kind: input.kind,
    amount: input.amount,
    currency: input.currency,
    category: input.category,
    merchant: input.merchant,
    description: input.description,
    payment_method: input.paymentMethod,
    occurred_at: input.occurredAt,
    source: input.source,
  };

  const supabase = await createClient();
  const query = id
    ? supabase.from('financial_transactions').update(row).eq('id', id).select('id').single()
    : supabase.from('financial_transactions').insert(row).select('id').single();
  const { data, error } = await query;
  if (error) return fromDb(error);

  revalidate();
  const noun = input.kind === 'income' ? 'Ingreso' : 'Gasto';
  return success(id ? `${noun} actualizado.` : `${noun} guardado.`, data.id);
}

export async function deleteTransaction(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error, count } = await supabase.from('financial_transactions').delete({ count: 'exact' }).eq('id', id);
  if (error) return fromDb(error);
  if (!count) return failure('Ese movimiento ya no existe.');
  revalidate();
  return success('Movimiento borrado.');
}
