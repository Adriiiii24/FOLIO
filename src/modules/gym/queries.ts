import 'server-only';
import { addDays, localDate, localDayRangeUtc, utcIsoToZonedInput, weekStart, zonedToUtcIso } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { getToday } from '@/modules/settings/queries';
import { epley } from './form';

type LogRow = { reps: number; weight_kg: number; is_warmup: boolean };

/** Volumen: Σ repeticiones × peso, sin series de calentamiento. */
function volume(logs: readonly LogRow[]): number {
  return logs.reduce((sum, log) => (log.is_warmup ? sum : sum + log.reps * Number(log.weight_kg)), 0);
}

export async function getGymOverview() {
  const { today, timeZone } = await getToday();
  const from = weekStart(today);
  const week = localDayRangeUtc(from, addDays(from, 6), timeZone);
  // Comparación justa en cualquier momento del día: se cuenta POR SERIE (created_at), no por sesión, y la
  // semana pasada se corta a la misma hora de reloj de hace 7 días, en la zona del perfil (respeta el cambio
  // de hora). Contar por sesión metía entera una sesión del lunes pasado que empezó antes del corte, y el
  // chip se ponía rojo durante cada entreno.
  const nowLocal = utcIsoToZonedInput(new Date().toISOString(), timeZone);
  const sameInstantLastWeek = zonedToUtcIso(`${addDays(nowLocal.slice(0, 10), -7)}${nowLocal.slice(10)}`, timeZone);
  const lastWeekFrom = localDayRangeUtc(addDays(from, -7), addDays(from, -7), timeZone).fromIso;
  const supabase = await createClient();

  const logs = (fromIso: string, toIso: string) =>
    supabase
      .from('workout_logs')
      .select('reps, weight_kg, is_warmup')
      .gte('created_at', fromIso)
      .lt('created_at', toIso);

  const [thisWeek, lastWeek, sessions] = await Promise.all([
    logs(week.fromIso, week.toIso),
    logs(lastWeekFrom, sameInstantLastWeek),
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', week.fromIso)
      .lt('started_at', week.toIso),
  ]);
  if (thisWeek.error) throw new Error(thisWeek.error.message);
  if (lastWeek.error) throw new Error(lastWeek.error.message);
  if (sessions.error) throw new Error(sessions.error.message);

  return {
    weekFrom: from,
    weekVolume: volume(thisWeek.data),
    lastWeekVolume: volume(lastWeek.data),
    sessionsThisWeek: sessions.count ?? 0,
  };
}

export async function getGymSheet(selectedExercise?: string) {
  const [{ today, timeZone }, overview] = await Promise.all([getToday(), getGymOverview()]);
  const supabase = await createClient();
  const yearAgo = localDayRangeUtc(addDays(today, -365), today, timeZone).fromIso;

  const [open, recent, history] = await Promise.all([
    supabase
      .from('workouts')
      .select(
        'id, title, started_at, workout_logs(id, exercise, set_index, reps, weight_kg, rpe, is_warmup, created_at)',
      )
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1),
    supabase
      .from('workouts')
      .select('id, title, started_at, ended_at, perceived_effort, notes, workout_logs(reps, weight_kg, is_warmup)')
      .order('started_at', { ascending: false })
      .limit(15),
    supabase
      .from('workout_logs')
      .select('exercise, reps, weight_kg, is_warmup, created_at')
      .gte('created_at', yearAgo)
      .order('created_at', { ascending: false })
      .limit(3000),
  ]);
  if (open.error) throw new Error(open.error.message);
  if (recent.error) throw new Error(recent.error.message);
  if (history.error) throw new Error(history.error.message);

  // Récords: mejor 1RM estimado por ejercicio (nombre normalizado a minúsculas) en el último año.
  // Sin peso corporal: un 1RM de 0 kg no dice nada.
  const records = new Map<string, { exercise: string; e1rm: number; weightKg: number; reps: number; on: string }>();
  for (const log of history.data) {
    if (log.is_warmup || log.reps <= 0 || Number(log.weight_kg) <= 0) continue;
    const key = log.exercise.toLocaleLowerCase('es');
    const e1rm = epley(Number(log.weight_kg), log.reps);
    const best = records.get(key);
    if (!best || e1rm > best.e1rm) {
      records.set(key, {
        exercise: log.exercise,
        e1rm,
        weightKg: Number(log.weight_kg),
        reps: log.reps,
        on: localDate(timeZone, new Date(log.created_at)),
      });
    }
  }
  const exercises = [
    ...new Map(history.data.map((log) => [log.exercise.toLocaleLowerCase('es'), log.exercise])).values(),
  ];

  const exercise =
    selectedExercise &&
    exercises.some((name) => name.toLocaleLowerCase('es') === selectedExercise.toLocaleLowerCase('es'))
      ? selectedExercise
      : exercises[0];
  let progress: {
    workout_id: string;
    performed_on: string;
    top_weight_kg: number;
    best_e1rm_kg: number;
    volume_kg: number;
    sets: number;
  }[] = [];
  if (exercise) {
    const result = await supabase.rpc('exercise_progress', { p_exercise: exercise, p_from: addDays(today, -180) });
    if (result.error) throw new Error(result.error.message);
    progress = result.data;
  }

  const openWorkout = open.data[0] ?? null;
  return {
    today,
    timeZone,
    overview,
    openWorkout: openWorkout
      ? { ...openWorkout, sets: [...openWorkout.workout_logs].sort((a, b) => a.created_at.localeCompare(b.created_at)) }
      : null,
    recent: recent.data.map((workout) => ({
      ...workout,
      setCount: workout.workout_logs.filter((log) => !log.is_warmup).length,
      volume: volume(workout.workout_logs),
    })),
    exercises,
    exercise: exercise ?? null,
    progress,
    records: [...records.values()].sort((a, b) => b.e1rm - a.e1rm).slice(0, 8),
  };
}
