import 'server-only';
import { localDate, localDayRangeUtc } from '@/lib/dates';
import type { DbClient } from '@/lib/supabase/types';

/**
 * Tope diario de usos de IA por persona. El nivel gratuito de Gemini limita peticiones por PROYECTO,
 * compartidas entre todas las cuentas: sin este tope, un visitante podría agotar la cuota de los demás.
 * La cifra es provisional hasta que el autor la decida (PROPOSAL §8); AI_DAILY_LIMIT la sobrescribe.
 */
export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 20);

export type AiQuota = { used: number; limit: number; exceeded: boolean; remaining: number };

/**
 * Usos de hoy (día local del perfil). Los embeddings y el briefing no cuentan: los genera el sistema, no la
 * persona. Las filas de ai_runs no se pueden borrar ni editar con la sesión, así que el tope no se reinicia.
 */
export async function getAiQuota(db: DbClient, userId: string, timeZone: string): Promise<AiQuota> {
  const today = localDate(timeZone);
  const { fromIso } = localDayRangeUtc(today, today, timeZone);
  const { count, error } = await db
    .from('ai_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('task', 'in', '(embedding,briefing)')
    .gte('created_at', fromIso);
  // Si no se puede contar, se bloquea: mejor un «inténtalo luego» que saltarse el tope.
  const used = error ? AI_DAILY_LIMIT : (count ?? 0);
  return {
    used,
    limit: AI_DAILY_LIMIT,
    exceeded: used >= AI_DAILY_LIMIT,
    remaining: Math.max(0, AI_DAILY_LIMIT - used),
  };
}
