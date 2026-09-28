'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { createClient } from '@/lib/supabase/server';
import { NoteFormSchema } from './form';

function revalidate() {
  revalidatePath('/brain');
  revalidatePath('/home');
}

export async function saveNote(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = NoteFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, entryDate, title, content, mood, tags } = parsed.data;
  const row = { entry_date: entryDate, title, content, mood, tags };

  const supabase = await createClient();
  const query = id
    ? supabase.from('notes').update(row).eq('id', id).select('id').single()
    : supabase
        .from('notes')
        .insert({ ...row, source: 'manual' })
        .select('id')
        .single();
  const { data, error } = await query;
  if (error) return fromDb(error);

  revalidate();
  return success(id ? 'Entrada actualizada.' : 'Entrada guardada.', data.id);
}

export async function deleteNote(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error, count } = await supabase.from('notes').delete({ count: 'exact' }).eq('id', id);
  if (error) return fromDb(error);
  if (!count) return failure('Esa entrada ya no existe.');
  revalidate();
  return success('Entrada borrada.');
}
