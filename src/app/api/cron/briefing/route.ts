import { NextResponse } from 'next/server';
import { localDate } from '@/lib/dates';
import { createAdminClient } from '@/lib/supabase/admin';
import { backfillEmbeddings } from '@/modules/brain/embeddings';
import { generateBriefingForUser, type BriefingOutcome } from '@/modules/home/briefing/generate';

// Hobby + Fluid compute: hasta 300 s por invocación.
export const maxDuration = 300;

/** Un 503 deja los modelos en reposo 30 s (lib/ai/models.ts): se espera eso antes del único reintento. */
const BUSY_WAIT_MS = 31_000;
/** Margen antes del límite de 300 s: pasado este tiempo, solo se hace el backfill. */
const TIME_BUDGET_MS = 220_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Job programado (vercel.json, una vez al día): briefing de cada usuario con el briefing activado y
 * backfill de embeddings pendientes. Idempotente: reejecutarlo no duplica nada.
 */
export async function GET(request: Request) {
  // Vercel Cron envía «Authorization: Bearer <CRON_SECRET>» si la variable está definida.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = createAdminClient();
  const { data: users, error } = await db.from('profiles').select('id, timezone').eq('briefing_enabled', true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const report: { user: string; status: string; embedded: number; problems?: string[] }[] = [];
  // Con la cuota diaria gratuita agotada en todos los modelos, no se gastan más intentos hoy.
  let quotaExhausted = false;
  const startedAt = Date.now();
  const outOfTime = () => Date.now() - startedAt > TIME_BUDGET_MS;
  for (const user of users) {
    const today = localDate(user.timezone);
    try {
      const { data: existing } = await db
        .from('daily_briefings')
        .select('id')
        .eq('user_id', user.id)
        .eq('briefing_date', today)
        .maybeSingle();
      let outcome: BriefingOutcome | { status: 'already_done' | 'skipped_quota' | 'skipped_time' };
      if (existing) outcome = { status: 'already_done' };
      else if (quotaExhausted) outcome = { status: 'skipped_quota' };
      else if (outOfTime()) outcome = { status: 'skipped_time' };
      else {
        outcome = await generateBriefingForUser(db, user, today);
        if (outcome.status === 'busy' && !outOfTime()) {
          await sleep(BUSY_WAIT_MS);
          outcome = await generateBriefingForUser(db, user, today);
        }
        if (outcome.status === 'quota') quotaExhausted = true;
      }
      const embedded = await backfillEmbeddings(db, user.id);
      report.push({
        user: user.id,
        status: outcome.status,
        embedded,
        ...('problems' in outcome ? { problems: outcome.problems } : {}),
      });
    } catch {
      report.push({ user: user.id, status: 'error', embedded: 0 });
    }
  }

  return NextResponse.json({ date: new Date().toISOString(), report });
}
