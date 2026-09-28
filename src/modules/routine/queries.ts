import 'server-only';
import { addDays, localDayRangeUtc, weekStart } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { getToday } from '@/modules/settings/queries';

export async function getRoutineSheet() {
  const { today, timeZone } = await getToday();
  const from = weekStart(today);
  const focusFrom = addDays(today, -6);
  const todayRange = localDayRangeUtc(today, today, timeZone);
  const supabase = await createClient();

  const [habits, logs, stats, active, focusDays, focusToday] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, cadence, target_per_period, sort_order, created_at')
      .is('archived_at', null)
      .order('sort_order')
      .order('created_at'),
    supabase.from('habit_logs').select('id, habit_id, logged_on').gte('logged_on', from).lte('logged_on', today),
    supabase.rpc('habit_stats', { p_from: from, p_to: today }),
    supabase
      .from('focus_sessions')
      .select('id, label, started_at, planned_minutes, interruptions')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1),
    supabase.rpc('focus_stats', { p_from: focusFrom, p_to: today }),
    supabase
      .from('focus_sessions')
      .select('id, label, started_at, ended_at, duration_s, interruptions')
      .not('ended_at', 'is', null)
      .gte('started_at', todayRange.fromIso)
      .lt('started_at', todayRange.toIso)
      .order('started_at', { ascending: false }),
  ]);
  for (const result of [habits, logs, stats, active, focusDays, focusToday]) {
    if (result.error) throw new Error(result.error.message);
  }

  const streakById = new Map((stats.data ?? []).map((row) => [row.habit_id, row.current_streak ?? 0]));
  const habitRows = (habits.data ?? []).map((habit) => {
    const habitLogs = (logs.data ?? []).filter((log) => log.habit_id === habit.id);
    const todayLog = habitLogs.find((log) => log.logged_on === today);
    return {
      ...habit,
      doneToday: Boolean(todayLog),
      doneThisWeek: habitLogs.length,
      streak: streakById.get(habit.id) ?? 0,
    };
  });

  const focusByDay = new Map((focusDays.data ?? []).map((row) => [row.day, Number(row.focus_minutes)]));
  const best = habitRows.filter((habit) => habit.cadence === 'daily').sort((a, b) => b.streak - a.streak)[0];

  return {
    today,
    timeZone,
    weekFrom: from,
    habits: habitRows,
    bestStreak: best && best.streak > 0 ? { name: best.name, days: best.streak } : null,
    doneToday: habitRows.filter((habit) => habit.cadence === 'daily' && habit.doneToday).length,
    dailyCount: habitRows.filter((habit) => habit.cadence === 'daily').length,
    activeFocus: active.data?.[0] ?? null,
    focusDays: Array.from({ length: 7 }, (_, i) => addDays(focusFrom, i)).map((day) => ({
      day,
      minutes: focusByDay.get(day) ?? 0,
    })),
    focusToday: focusToday.data ?? [],
  };
}

export async function getRoutineOverview() {
  const sheet = await getRoutineSheet();
  return { bestStreak: sheet.bestStreak, doneToday: sheet.doneToday, dailyCount: sheet.dailyCount };
}
