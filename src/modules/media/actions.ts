'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { createClient } from '@/lib/supabase/server';
import { getToday } from '@/modules/settings/queries';
import { MediaFormSchema } from './form';

function revalidate() {
  revalidatePath('/media');
  revalidatePath('/home');
}

export async function saveMediaItem(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = MediaFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, kind, title, creator, status, rating, progressPct, startedOn, finishedOn, review } = parsed.data;
  const { today } = await getToday();

  // Un terminado sin fecha de fin se da por terminado hoy; «terminados este año» depende de ella.
  const row = {
    kind,
    title,
    creator,
    status,
    rating,
    progress_pct: status === 'done' ? 100 : progressPct,
    started_on: startedOn ?? (status === 'in_progress' ? today : null),
    finished_on: finishedOn ?? (status === 'done' ? today : null),
    review,
  };

  const supabase = await createClient();
  const query = id
    ? supabase.from('media_items').update(row).eq('id', id).select('id').single()
    : supabase.from('media_items').insert(row).select('id').single();
  const { data, error } = await query;
  if (error) return fromDb(error);

  revalidate();
  return success(id ? 'Ficha actualizada.' : 'Ficha guardada.', data.id);
}

/** Atajo de la lista: marcar como terminado sin abrir el formulario. */
export async function finishMediaItem(id: string): Promise<FormState> {
  const { today } = await getToday();
  const supabase = await createClient();
  const { error } = await supabase
    .from('media_items')
    .update({ status: 'done', progress_pct: 100, finished_on: today })
    .eq('id', id);
  if (error) return fromDb(error);
  revalidate();
  return success('Marcado como terminado.');
}

export async function deleteMediaItem(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error, count } = await supabase.from('media_items').delete({ count: 'exact' }).eq('id', id);
  if (error) return fromDb(error);
  if (!count) return failure('Esa ficha ya no existe.');
  revalidate();
  return success('Ficha borrada.');
}
