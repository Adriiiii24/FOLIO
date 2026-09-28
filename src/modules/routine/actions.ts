'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { createClient } from '@/lib/supabase/server';
import { getToday } from '@/modules/settings/queries';
import { FocusFormSchema, HabitFormSchema, sameHabitName } from './form';

function revalidate() {
  revalidatePath('/routine');
  revalidatePath('/home');
}

export async function saveHabit(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = HabitFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, name, cadence, targetPerPeriod } = parsed.data;
  const row = { name, cadence, target_per_period: targetPerPeriod };

  const supabase = await createClient();
  const query = id
    ? supabase.from('habits').update(row).eq('id', id).select('id').single()
    : supabase.from('habits').insert(row).select('id').single();
  const { data, error } = await query;
  if (error) return fromDb(error);
  revalidate();
  return success(id ? 'Hábito actualizado.' : 'Hábito creado.', data.id);
}

export async function archiveHabit(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from('habits').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) return fromDb(error);
  revalidate();
  return success('Hábito archivado. Su historial se conserva.');
}

export async function deleteHabit(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error, count } = await supabase.from('habits').delete({ count: 'exact' }).eq('id', id);
  if (error) return fromDb(error);
  if (!count) return failure('Ese hábito ya no existe.');
  revalidate();
  return success('Hábito borrado, con su historial.');
}

/** Marca o desmarca un hábito en el día LOCAL de hoy. Idempotente: marcar dos veces no duplica. */
export async function setHabitDone(habitId: string, done: boolean): Promise<FormState> {
  const { today } = await getToday();
  const supabase = await createClient();
  const { error } = done
    ? await supabase
        .from('habit_logs')
        .upsert({ habit_id: habitId, logged_on: today }, { onConflict: 'habit_id,logged_on', ignoreDuplicates: true })
    : await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('logged_on', today);
  if (error) return fromDb(error);
  revalidate();
  return success(done ? 'Hecho hoy.' : 'Desmarcado.');
}

/**
 * Desde la barra de entrada: «hecho: meditar». Marca el hábito con ese nombre o, si no existe, lo crea
 * (diario) y lo marca. Devuelve el id del registro de hoy, para poder deshacerlo.
 */
export async function logHabitByName(_previous: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('habitName') ?? '')
    .trim()
    .slice(0, 60);
  if (!name) return failure('Escribe el nombre del hábito.', { habitName: 'Escribe el nombre del hábito.' });

  const { today } = await getToday();
  const supabase = await createClient();
  const { data: habits, error } = await supabase.from('habits').select('id, name').is('archived_at', null);
  if (error) return fromDb(error);

  let habitId = habits.find((habit) => sameHabitName(habit.name, name))?.id;
  let created = false;
  if (!habitId) {
    const inserted = await supabase.from('habits').insert({ name }).select('id').single();
    if (inserted.error) return fromDb(inserted.error);
    habitId = inserted.data.id;
    created = true;
  }

  const log = await supabase
    .from('habit_logs')
    .upsert({ habit_id: habitId, logged_on: today }, { onConflict: 'habit_id,logged_on' })
    .select('id')
    .single();
  if (log.error) return fromDb(log.error);
  revalidate();
  return success(created ? `Hábito «${name}» creado y marcado hoy.` : `«${name}» marcado hoy.`, log.data.id);
}

export async function deleteHabitLog(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from('habit_logs').delete().eq('id', id);
  if (error) return fromDb(error);
  revalidate();
  return success('Check-in borrado.');
}

export async function startFocus(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = FocusFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const { count, error: activeError } = await supabase
    .from('focus_sessions')
    .select('id', { count: 'exact', head: true })
    .is('ended_at', null);
  if (activeError) return fromDb(activeError);
  if (count) return failure('Ya hay una sesión de foco en marcha. Termínala antes de empezar otra.');

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({ label: parsed.data.label, planned_minutes: parsed.data.plannedMinutes })
    .select('id')
    .single();
  if (error) return fromDb(error);
  revalidate();
  return success('Foco en marcha.', data.id);
}

export async function addInterruption(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('focus_sessions').select('interruptions').eq('id', id).single();
  if (error) return fromDb(error);
  const update = await supabase
    .from('focus_sessions')
    .update({ interruptions: Math.min(100, data.interruptions + 1) })
    .eq('id', id);
  if (update.error) return fromDb(update.error);
  revalidate();
  return success('Interrupción anotada.');
}

export async function finishFocus(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('focus_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', id)
    .is('ended_at', null);
  if (error) return fromDb(error);
  revalidate();
  return success('Sesión de foco guardada.');
}

export async function deleteFocusSession(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from('focus_sessions').delete().eq('id', id);
  if (error) return fromDb(error);
  revalidate();
  return success('Sesión de foco descartada.');
}
