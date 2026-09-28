import { addDays } from '@/lib/dates';

/**
 * Racha de escritura: días consecutivos con al menos una entrada, contando hasta hoy o hasta ayer
 * (hoy aún se puede escribir sin romperla).
 */
export function writingStreak(dates: readonly string[], today: string): number {
  const days = new Set(dates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
