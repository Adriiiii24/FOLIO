import 'server-only';
import { addDays, localDayRangeUtc } from '@/lib/dates';
import type { DbClient } from '@/lib/supabase/types';
import type { Metrics, MetricUnit } from './signals';

export type { Metric, Metrics, MetricUnit } from './signals';

const sumExpenses = (rows: { kind: string; total: number }[] | null) =>
  (rows ?? []).filter((row) => row.kind === 'expense').reduce((sum, row) => sum + Number(row.total), 0);

/**
 * Paso 1 · Recolectar: SQL determinista. `db` es el cliente administrativo (job programado), así que TODO
 * filtra por userId: las RPC con p_user_id y las tablas con .eq('user_id').
 */
export async function collectMetrics(db: DbClient, userId: string, timeZone: string, today: string): Promise<Metrics> {
  const yesterday = addDays(today, -1);
  const weekAgo = addDays(today, -7);
  const monthStart = `${today.slice(0, 8)}01`;
  const week = localDayRangeUtc(weekAgo, yesterday, timeZone);

  const [spendMonth, spendYesterday, nutrition, habits, focus, profile, workouts, notes] = await Promise.all([
    db.rpc('spending_summary', { p_from: monthStart, p_to: yesterday, p_user_id: userId }),
    db.rpc('spending_summary', { p_from: yesterday, p_to: yesterday, p_user_id: userId }),
    db.rpc('nutrition_daily', { p_from: yesterday, p_to: yesterday, p_user_id: userId }),
    db.rpc('habit_stats', { p_from: weekAgo, p_to: yesterday, p_user_id: userId }),
    db.rpc('focus_stats', { p_from: weekAgo, p_to: yesterday, p_user_id: userId }),
    db.from('profiles').select('monthly_budget').eq('id', userId).single(),
    db
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('started_at', week.fromIso)
      .lt('started_at', week.toIso),
    db
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('entry_date', weekAgo)
      .lte('entry_date', yesterday),
  ]);

  const metrics: Metrics = {};
  const put = (key: string, value: number, unit: MetricUnit, label: string) => {
    if (Number.isFinite(value)) metrics[key] = { value, unit, label };
  };

  // El 1 de cada mes, «hasta ayer» es el mes anterior: sin gasto del mes en curso que contar.
  if (today.slice(8, 10) !== '01') {
    const spentMonth = sumExpenses(spendMonth.data);
    put('vault.spend_mtd', spentMonth, 'eur', 'gasto del mes hasta ayer');
    const budget = Number(profile.data?.monthly_budget ?? 0);
    if (budget > 0) {
      const daysInMonth = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7), 0)).getUTCDate();
      put('vault.budget_used_pct', Math.round((spentMonth / budget) * 100), 'pct', 'presupuesto consumido');
      put(
        'vault.month_elapsed_pct',
        Math.round(((+today.slice(8, 10) - 1) / daysInMonth) * 100),
        'pct',
        'mes transcurrido',
      );
    }
  }
  put('vault.spend_yesterday', sumExpenses(spendYesterday.data), 'eur', 'gasto de ayer');

  const day = nutrition.data?.[0];
  if (day && Number(day.meals) > 0) {
    put('nutrition.kcal_yesterday', Number(day.calories_kcal), 'kcal', 'kcal de ayer');
    put('nutrition.protein_yesterday', Number(day.protein_g), 'g', 'proteína de ayer');
    if (day.kcal_target) put('nutrition.kcal_target', day.kcal_target, 'kcal', 'objetivo diario de kcal');
    if (day.protein_target) put('nutrition.protein_target', day.protein_target, 'g', 'objetivo diario de proteína');
  }

  const daily = (habits.data ?? []).filter((habit) => habit.cadence === 'daily');
  if (daily.length > 0) {
    put(
      'routine.best_streak',
      Math.max(0, ...daily.map((habit) => habit.current_streak ?? 0)),
      'days',
      'mejor racha activa',
    );
    put(
      'routine.habits_done_7d',
      daily.reduce((sum, habit) => sum + Number(habit.done_days), 0),
      'count',
      'check-ins en 7 días',
    );
  }

  const focusDays = focus.data ?? [];
  put(
    'focus.minutes_7d',
    focusDays.reduce((sum, d) => sum + Number(d.focus_minutes), 0),
    'min',
    'minutos de foco en 7 días',
  );
  put('gym.sessions_7d', workouts.count ?? 0, 'count', 'entrenos en 7 días');
  put('brain.notes_7d', notes.count ?? 0, 'count', 'entradas del diario en 7 días');

  return metrics;
}
