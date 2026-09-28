import 'server-only';
import { localDayRangeUtc, localTime } from '@/lib/dates';
import { money, number } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import { getBrainOverview } from '@/modules/brain/queries';
import { getGymOverview } from '@/modules/gym/queries';
import { getMediaOverview } from '@/modules/media/queries';
import { MEAL_TYPE_LABEL } from '@/modules/nutrition/form';
import { getNutritionOverview } from '@/modules/nutrition/queries';
import { getRoutineOverview } from '@/modules/routine/queries';
import { getProfile, getToday } from '@/modules/settings/queries';
import { getVaultOverview } from '@/modules/vault/queries';

// 01 // HOME es el único módulo que lee de los demás (ARCHITECTURE §4.2): el tablero y la línea del día.

export type TimelineItem = {
  key: string;
  at: string;
  time: string;
  tab: 'gym' | 'vault' | 'brain' | 'nutrition' | 'media' | 'routine';
  text: string;
};

async function getTimeline(): Promise<TimelineItem[]> {
  const [{ today, timeZone }, profile] = await Promise.all([getToday(), getProfile()]);
  const { fromIso, toIso } = localDayRangeUtc(today, today, timeZone);
  const supabase = await createClient();

  const [transactions, meals, workouts, notes, habitLogs, focus, media] = await Promise.all([
    supabase
      .from('financial_transactions')
      .select('id, kind, amount, currency, merchant, description, occurred_at')
      .gte('occurred_at', fromIso)
      .lt('occurred_at', toIso),
    supabase
      .from('macros')
      .select('id, meal_type, description, calories_kcal, eaten_at')
      .gte('eaten_at', fromIso)
      .lt('eaten_at', toIso),
    supabase
      .from('workouts')
      .select('id, title, started_at, workout_logs(id)')
      .gte('started_at', fromIso)
      .lt('started_at', toIso),
    supabase.from('notes').select('id, title, content, created_at').eq('entry_date', today),
    supabase.from('habit_logs').select('id, created_at, habits(name)').eq('logged_on', today),
    supabase
      .from('focus_sessions')
      .select('id, label, started_at, duration_s')
      .gte('started_at', fromIso)
      .lt('started_at', toIso)
      .not('ended_at', 'is', null),
    supabase.from('media_items').select('id, title, updated_at').eq('status', 'done').eq('finished_on', today),
  ]);
  for (const result of [transactions, meals, workouts, notes, habitLogs, focus, media]) {
    if (result.error) throw new Error(result.error.message);
  }

  const item = (key: string, at: string, tab: TimelineItem['tab'], text: string): TimelineItem => ({
    key,
    at,
    time: localTime(at, timeZone),
    tab,
    text,
  });
  const excerpt = (text: string) => (text.length > 70 ? `${text.slice(0, 70).trimEnd()}…` : text);

  return [
    ...(transactions.data ?? []).map((tx) =>
      item(
        `tx-${tx.id}`,
        tx.occurred_at,
        'vault',
        `${tx.kind === 'income' ? '+' : '−'}${money(Number(tx.amount), tx.currency ?? profile.currency)} · ${tx.merchant ?? tx.description ?? 'Movimiento'}`,
      ),
    ),
    ...(meals.data ?? []).map((meal) =>
      item(
        `meal-${meal.id}`,
        meal.eaten_at,
        'nutrition',
        `${MEAL_TYPE_LABEL[meal.meal_type]} · ${number(meal.calories_kcal)} kcal · ${excerpt(meal.description)}`,
      ),
    ),
    ...(workouts.data ?? []).map((workout) =>
      item(
        `wo-${workout.id}`,
        workout.started_at,
        'gym',
        `${workout.title} · ${workout.workout_logs.length} ${workout.workout_logs.length === 1 ? 'serie' : 'series'}`,
      ),
    ),
    ...(notes.data ?? []).map((note) =>
      item(`note-${note.id}`, note.created_at, 'brain', note.title ?? excerpt(note.content)),
    ),
    ...(habitLogs.data ?? []).map((log) =>
      item(`habit-${log.id}`, log.created_at, 'routine', `Hecho: ${log.habits?.name ?? 'hábito'}`),
    ),
    ...(focus.data ?? []).map((session) =>
      item(
        `focus-${session.id}`,
        session.started_at,
        'routine',
        `Foco · ${Math.round((session.duration_s ?? 0) / 60)} min${session.label ? ` · ${session.label}` : ''}`,
      ),
    ),
    ...(media.data ?? []).map((entry) =>
      item(`media-${entry.id}`, entry.updated_at, 'media', `Terminado: ${entry.title}`),
    ),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

export async function getHomeSheet() {
  const [{ today }, profile, gym, vault, brain, nutrition, media, routine, timeline] = await Promise.all([
    getToday(),
    getProfile(),
    getGymOverview(),
    getVaultOverview(),
    getBrainOverview(),
    getNutritionOverview(),
    getMediaOverview(),
    getRoutineOverview(),
    getTimeline(),
  ]);

  // Cuenta sin nada registrado: el tablero enseña a usar la barra en vez de mostrar ceros sin contexto.
  const empty =
    gym.sessionsThisWeek === 0 &&
    vault.count === 0 &&
    brain.total === 0 &&
    nutrition.meals === 0 &&
    media.finishedThisYear === 0 &&
    routine.dailyCount === 0 &&
    timeline.length === 0;

  return { today, displayName: profile.display_name, gym, vault, brain, nutrition, media, routine, timeline, empty };
}
