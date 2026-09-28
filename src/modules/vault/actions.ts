'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { parseAiMeta } from '@/lib/ai/draft-meta';
import { zonedToUtcIso } from '@/lib/dates';
import type { Json } from '@/lib/supabase/database.types';
import { createClient, requireUserId } from '@/lib/supabase/server';
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

  const supabase = await createClient();
  const userId = await requireUserId(supabase);
  if (!userId) return failure('Tu sesión ha caducado. Vuelve a entrar.');
  // Un borrador de ticket trae su metadato (ARCHITECTURE §3.5). Solo en altas: editar no cambia el origen.
  const ai = id ? null : parseAiMeta(formData.get('ai'), userId);
  if (ai === 'invalid') return failure('El borrador no es válido. Descártalo y vuelve a intentarlo.');

  const profile = await getProfile();
  const domain = TransactionInputSchema.safeParse({
    ...values,
    currency: profile.currency,
    occurredAt: zonedToUtcIso(occurredAt, profile.timezone),
    source: ai?.source === 'voice' ? 'voice' : ai ? 'ocr' : 'manual',
    taxAmount: ai?.taxAmount ?? null,
    taxBreakdown: ai?.taxBreakdown ?? null,
    receiptPath: ai?.path ?? null,
    aiConfidence: ai?.confidence ?? null,
    rawExtraction: ai?.raw,
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
  };

  const query = id
    ? supabase.from('financial_transactions').update(row).eq('id', id).select('id').single()
    : supabase
        .from('financial_transactions')
        .insert({
          ...row,
          source: input.source,
          tax_amount: input.taxAmount,
          tax_breakdown: input.taxBreakdown,
          receipt_path: input.receiptPath,
          ai_confidence: input.aiConfidence,
          raw_extraction: (input.rawExtraction ?? null) as Json,
        })
        .select('id')
        .single();
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
