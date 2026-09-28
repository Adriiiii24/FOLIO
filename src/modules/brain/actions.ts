'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { parseAiMeta } from '@/lib/ai/draft-meta';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { embedNote } from './embeddings';
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
  const userId = await requireUserId(supabase);
  if (!userId) return failure('Tu sesión ha caducado. Vuelve a entrar.');
  // Un borrador de voz trae el audio y su duración. Solo en altas.
  const ai = id ? null : parseAiMeta(formData.get('ai'), userId);
  if (ai === 'invalid') return failure('El borrador no es válido. Descártalo y vuelve a intentarlo.');

  const query = id
    ? supabase.from('notes').update(row).eq('id', id).select('id').single()
    : supabase
        .from('notes')
        .insert({
          ...row,
          source: ai?.source === 'voice' ? 'voice' : 'manual',
          audio_path: ai?.source === 'voice' ? ai.path : null,
          audio_duration_s: ai?.source === 'voice' ? ai.durationS : null,
        })
        .select('id')
        .single();
  const { data, error } = await query;
  if (error) return fromDb(error);

  // El embedding (búsqueda por significado), después de responder: la persona no espera por él.
  // Al editar, el trigger ya lo dejó en null; si falla, el backfill diario lo recalcula.
  after(() => embedNote(supabase, data.id));
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
