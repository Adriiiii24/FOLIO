import 'server-only';
import { daysBetween, localDayRangeUtc, monthEnd, monthStart } from '@/lib/dates';
import { createClient } from '@/lib/supabase/server';
import { getProfile, getToday } from '@/modules/settings/queries';
import { CATEGORY_LABEL } from './labels';

const MONTH = /^\d{4}-\d{2}$/;

/** Mes pedido ('YYYY-MM') o el actual; nunca un mes futuro. */
export async function resolveMonth(requested?: string): Promise<string> {
  const { today } = await getToday();
  const current = today.slice(0, 7);
  return requested && MONTH.test(requested) && requested <= current ? requested : current;
}

export async function getVaultMonth(requestedMonth?: string) {
  const [{ today, timeZone }, profile, month] = await Promise.all([
    getToday(),
    getProfile(),
    resolveMonth(requestedMonth),
  ]);
  const from = monthStart(`${month}-01`);
  const to = monthEnd(from);
  const { fromIso, toIso } = localDayRangeUtc(from, to, timeZone);

  const supabase = await createClient();
  const [transactions, summary] = await Promise.all([
    supabase
      .from('financial_transactions')
      .select('id, kind, amount, currency, category, merchant, description, payment_method, occurred_at, source')
      .gte('occurred_at', fromIso)
      .lt('occurred_at', toIso)
      .order('occurred_at', { ascending: false })
      .limit(500),
    supabase.rpc('spending_summary', { p_from: from, p_to: to }),
  ]);
  if (transactions.error) throw new Error(transactions.error.message);
  if (summary.error) throw new Error(summary.error.message);

  const expenses = summary.data.filter((row) => row.kind === 'expense');
  const spent = expenses.reduce((sum, row) => sum + Number(row.total), 0);
  const income = summary.data.filter((row) => row.kind === 'income').reduce((sum, row) => sum + Number(row.total), 0);

  const byCategory = expenses
    .map((row) => ({
      category: row.category,
      label: CATEGORY_LABEL[row.category],
      total: Number(row.total),
      count: Number(row.tx_count),
    }))
    .sort((a, b) => b.total - a.total);

  const isCurrentMonth = month === today.slice(0, 7);
  const budget = profile.monthly_budget === null ? null : Number(profile.monthly_budget);
  const budgetPct = budget ? Math.round((spent / budget) * 100) : null;
  // Ritmo: fracción del presupuesto gastada frente a la fracción del mes transcurrida.
  const monthFraction = isCurrentMonth ? (daysBetween(from, today) + 1) / (daysBetween(from, to) + 1) : 1;
  const paceDelta = budget ? Math.round((spent / budget - monthFraction) * 100) : null;

  return {
    month,
    from,
    to,
    isCurrentMonth,
    currency: profile.currency,
    timeZone,
    transactions: transactions.data,
    spent,
    income,
    byCategory,
    budget,
    budgetPct,
    paceDelta,
  };
}

/** Resumen para el tablero de 01 // INICIO. */
export async function getVaultOverview() {
  const month = await getVaultMonth();
  return { spent: month.spent, budgetPct: month.budgetPct, currency: month.currency, count: month.transactions.length };
}
