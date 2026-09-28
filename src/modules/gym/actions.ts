'use server';

import { revalidatePath } from 'next/cache';
import { failure, formFields, fromDb, fromZod, success, type FormState } from '@/lib/action-result';
import { localDate, zonedToUtcIso } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/modules/settings/queries';
import { QuickSetsFormSchema, SetFormSchema, WorkoutFormSchema } from './form';

function revalidate() {
  revalidatePath('/gym');
  revalidatePath('/home');
}

/** Nombre por defecto de una sesión: «Entreno del jueves». */
function defaultTitle(timeZone: string): string {
  const day = new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone }).format(new Date());
  return `Entreno del ${day}`;
}

export async function startWorkout(_previous: FormState, formData: FormData): Promise<FormState> {
  const profile = await getProfile();
  const title = String(formData.get('title') ?? '').trim() || defaultTitle(profile.timezone);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workouts')
    .insert({ title: title.slice(0, 80) })
    .select('id')
    .single();
  if (error) return fromDb(error);
  revalidate();
  return success('Sesión empezada.', data.id);
}

export async function saveWorkout(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = WorkoutFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, title, startedAt, perceivedEffort, notes } = parsed.data;
  if (!id) return failure('Falta la sesión que se edita.');
  const profile = await getProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from('workouts')
    .update({ title, started_at: zonedToUtcIso(startedAt, profile.timezone), perceived_effort: perceivedEffort, notes })
    .eq('id', id);
  if (error) return fromDb(error);
  revalidate();
  return success('Sesión actualizada.', id);
}

export async function finishWorkout(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('workouts')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', id)
    .is('ended_at', null);
  if (error) return fromDb(error);
  revalidate();
  return success('Sesión terminada.');
}

export async function deleteWorkout(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error, count } = await supabase.from('workouts').delete({ count: 'exact' }).eq('id', id);
  if (error) return fromDb(error);
  if (!count) return failure('Esa sesión ya no existe.');
  revalidate();
  return success('Sesión borrada, con sus series.');
}

/** ilike con el texto literal: % y _ del nombre no son comodines. */
const literal = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

type SetValues = {
  exercise: string;
  reps: number;
  weightKg: number;
  rpe: number | null;
  isWarmup: boolean;
  count: number;
};

/** Inserta `count` series iguales tras la última serie de ese ejercicio en la sesión. */
async function insertSets(workoutId: string, values: SetValues): Promise<FormState> {
  const supabase = await createClient();
  const { data: last, error: lastError } = await supabase
    .from('workout_logs')
    .select('set_index')
    .eq('workout_id', workoutId)
    .ilike('exercise', literal(values.exercise))
    .order('set_index', { ascending: false })
    .limit(1);
  if (lastError) return fromDb(lastError);

  const start = (last[0]?.set_index ?? 0) + 1;
  if (start + values.count - 1 > 50) return failure('Máximo 50 series por ejercicio y sesión.');
  const rows = Array.from({ length: values.count }, (_, i) => ({
    workout_id: workoutId,
    exercise: values.exercise,
    set_index: start + i,
    reps: values.reps,
    weight_kg: values.weightKg,
    rpe: values.rpe,
    is_warmup: values.isWarmup,
  }));
  const { data, error } = await supabase.from('workout_logs').insert(rows).select('id');
  if (error) return fromDb(error);
  revalidate();
  const noun = values.count === 1 ? 'serie añadida' : 'series añadidas';
  return success(`${values.count} ${noun}: ${values.exercise}.`, data.map((row) => row.id).join(','));
}

export async function addSets(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = SetFormSchema.safeParse({ count: '1', ...formFields(formData) });
  if (!parsed.success) return fromZod(parsed.error);
  const { workoutId, ...values } = parsed.data;
  return insertSets(workoutId, values);
}

/** Series desde la barra de entrada: van a la sesión abierta o a una nueva de hoy. */
export async function addQuickSets(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = QuickSetsFormSchema.safeParse(formFields(formData));
  if (!parsed.success) return fromZod(parsed.error);

  const profile = await getProfile();
  const supabase = await createClient();
  const { data: open, error } = await supabase
    .from('workouts')
    .select('id, started_at')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1);
  if (error) return fromDb(error);

  const today = localDate(profile.timezone);
  let workoutId = open[0] && localDate(profile.timezone, new Date(open[0].started_at)) === today ? open[0].id : null;
  if (!workoutId) {
    const created = await supabase
      .from('workouts')
      .insert({ title: defaultTitle(profile.timezone) })
      .select('id')
      .single();
    if (created.error) return fromDb(created.error);
    workoutId = created.data.id;
  }
  return insertSets(workoutId, parsed.data);
}

export async function repeatLastSet(workoutId: string): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workout_logs')
    .select('exercise, reps, weight_kg, rpe, is_warmup')
    .eq('workout_id', workoutId)
    .order('created_at', { ascending: false })
    .order('set_index', { ascending: false })
    .limit(1);
  if (error) return fromDb(error);
  const last = data[0];
  if (!last) return failure('Aún no hay ninguna serie que repetir.');
  return insertSets(workoutId, {
    exercise: last.exercise,
    reps: last.reps,
    weightKg: Number(last.weight_kg),
    rpe: last.rpe === null ? null : Number(last.rpe),
    isWarmup: last.is_warmup,
    count: 1,
  });
}

export async function deleteSet(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error, count } = await supabase.from('workout_logs').delete({ count: 'exact' }).eq('id', id);
  if (error) return fromDb(error);
  if (!count) return failure('Esa serie ya no existe.');
  revalidate();
  return success('Serie borrada.');
}

/** Deshacer desde el aviso de la barra de entrada: borra las series recién creadas por su id de lote. */
export async function deleteSets(ids: string[]): Promise<FormState> {
  if (ids.length === 0) return success('Nada que deshacer.');
  const supabase = await createClient();
  const { error } = await supabase.from('workout_logs').delete().in('id', ids);
  if (error) return fromDb(error);
  revalidate();
  return success('Series borradas.');
}
