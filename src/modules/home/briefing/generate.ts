import 'server-only';
import { generateText, Output } from 'ai';
import { AiUnavailableError, MODEL_CHAIN, models, providerOptions } from '@/lib/ai/models';
import { BRIEFING_SYSTEM } from '@/lib/ai/prompts';
import { BriefingSchema } from '@/lib/ai/schemas/briefing';
import { errorCode, recordAiRun } from '@/lib/ai/telemetry';
import type { Json } from '@/lib/supabase/database.types';
import type { DbClient } from '@/lib/supabase/types';
import { collectMetrics } from './metrics';
import { formatMetric } from './render';
import { detectSignals, type BriefingSignal, type Metrics } from './signals';
import { validateBriefing } from './validate';

/** `busy`: los modelos gratuitos están saturados (se puede reintentar); `quota`: cuota diaria agotada en todos. */
export type BriefingOutcome = {
  status: 'created' | 'rejected' | 'error' | 'busy' | 'quota' | 'skipped_empty';
  problems?: string[];
};

/** Métricas de actividad: si todas son cero, no hay nada que contar y no se gasta cuota de IA. */
const ACTIVITY = [
  'vault.spend_mtd',
  'vault.spend_yesterday',
  'nutrition.kcal_yesterday',
  'routine.habits_done_7d',
  'focus.minutes_7d',
  'gym.sessions_7d',
  'brain.notes_7d',
];

function briefingPrompt(today: string, metrics: Metrics, signals: BriefingSignal[], problems: string[]) {
  const metricLines = Object.entries(metrics).map(([key, m]) => `- {{${key}}} = ${formatMetric(m)} (${m.label})`);
  const signalLines = signals.map((s) => `- [${s.module} · ${s.severity}] ${s.fact}`);
  return [
    `Fecha del briefing: ${today}.`,
    'Métricas disponibles (usa solo estos marcadores; los valores son para que juzgues la importancia, no para copiarlos):',
    ...metricLines,
    'Señales detectadas, de más a menos prioritaria:',
    ...(signalLines.length ? signalLines : ['- Ninguna destacable: resume el estado general.']),
    ...(problems.length ? ['El intento anterior se rechazó por:', ...problems.map((p) => `- ${p}`)] : []),
  ].join('\n');
}

/**
 * Pasos 3 a 5 · Redactar, validar (con un reintento) y persistir. Idempotente por (user_id, fecha).
 * `db` es el cliente administrativo del job programado: todo filtra por user.id.
 */
export async function generateBriefingForUser(
  db: DbClient,
  user: { id: string; timezone: string },
  today: string,
): Promise<BriefingOutcome> {
  const metrics = await collectMetrics(db, user.id, user.timezone, today);
  if (ACTIVITY.every((key) => !metrics[key]?.value)) return { status: 'skipped_empty' };
  const signals = detectSignals(metrics);
  let problems: string[] = [];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const startedAt = performance.now();
    try {
      const { output, usage, response } = await generateText({
        model: models.briefing,
        system: BRIEFING_SYSTEM,
        prompt: briefingPrompt(today, metrics, signals, problems),
        output: Output.object({ schema: BriefingSchema, name: 'briefing' }),
        providerOptions: providerOptions('briefing'),
      });
      const result = validateBriefing(output, metrics);
      const model = response.modelId || MODEL_CHAIN.briefing[0];
      await recordAiRun(db, {
        task: 'briefing',
        model,
        status: result.briefing ? 'ok' : 'rejected',
        startedAt,
        usage,
        userId: user.id,
      });

      if (result.briefing) {
        const { error } = await db.from('daily_briefings').upsert(
          {
            user_id: user.id,
            briefing_date: today,
            content: result.briefing as unknown as NonNullable<Json>,
            metrics: metrics as unknown as NonNullable<Json>,
            model,
          },
          { onConflict: 'user_id,briefing_date', ignoreDuplicates: true },
        );
        return error ? { status: 'error', problems: [error.message] } : { status: 'created' };
      }
      problems = result.problems;
    } catch (error) {
      await recordAiRun(db, {
        task: 'briefing',
        model: MODEL_CHAIN.briefing[0],
        status: 'error',
        startedAt,
        errorCode: errorCode(error),
        userId: user.id,
      });
      if (error instanceof AiUnavailableError) return { status: error.reason === 'daily' ? 'quota' : 'busy' };
      return { status: 'error', problems: [errorCode(error)] };
    }
  }
  return { status: 'rejected', problems };
}
