import 'server-only';
import { APICallError, RetryError, type LanguageModelUsage } from 'ai';
import type { Database } from '@/lib/supabase/database.types';
import type { DbClient } from '@/lib/supabase/types';

type AiRun = {
  task: Database['public']['Enums']['ai_task'];
  /** El modelo que respondió de verdad (con la reserva, puede no ser el primero de la cadena). */
  model: string;
  status: Database['public']['Enums']['ai_run_status'];
  /** performance.now() al empezar la llamada. */
  startedAt: number;
  usage?: Pick<LanguageModelUsage, 'inputTokens' | 'outputTokens'>;
  embeddingTokens?: number;
  subject?: { table: string; id: string };
  errorCode?: string;
  /** Solo con el cliente administrativo (job programado); con sesión lo pone auth.uid(). */
  userId?: string;
};

/** Código corto y sin datos personales: el nombre del error o el estado HTTP del proveedor. */
export function errorCode(error: unknown): string {
  // Tras agotar los reintentos, la causa útil es el último error, no el envoltorio.
  if (RetryError.isInstance(error)) return errorCode(error.lastError);
  if (APICallError.isInstance(error)) return `http_${error.statusCode ?? 'unknown'}`;
  return error instanceof Error ? error.name : 'unknown';
}

/**
 * Una fila por llamada a un modelo: latencia, tokens y resultado. Con el nivel gratuito el coste es 0,
 * pero las filas siguen contando: son la base del tope diario (quota.ts) y del eval.
 */
export async function recordAiRun(db: DbClient, run: AiRun): Promise<void> {
  const { error } = await db.from('ai_runs').insert({
    ...(run.userId ? { user_id: run.userId } : {}),
    task: run.task,
    model: run.model,
    status: run.status,
    input_tokens: run.usage?.inputTokens ?? run.embeddingTokens ?? 0,
    output_tokens: run.usage?.outputTokens ?? 0,
    latency_ms: Math.round(performance.now() - run.startedAt),
    cost_usd: 0,
    subject_table: run.subject?.table ?? null,
    subject_id: run.subject?.id ?? null,
    error_code: run.errorCode ?? null,
  });

  // La telemetría nunca rompe el flujo del usuario.
  if (error) console.error('ai_runs insert failed:', error.message);
}
