import 'server-only';
import { embed, embedMany } from 'ai';
import { asDocument, EMBEDDING_MODEL, embeddingOptions, models } from '@/lib/ai/models';
import { errorCode, recordAiRun } from '@/lib/ai/telemetry';
import type { DbClient } from '@/lib/supabase/types';

const MODEL_TAG = `google/${EMBEDDING_MODEL}`;

// pgvector acepta el literal '[0.1,0.2,…]': JSON.stringify de un number[] produce exactamente eso,
// y los tipos generados por Supabase declaran las columnas vector como string.
const toVector = (embedding: number[]) => JSON.stringify(embedding);

/** Texto de la nota con el formato de documento de gemini-embedding-2, dentro de su límite de entrada. */
const noteText = (note: { title: string | null; content: string }) =>
  asDocument({ title: note.title, content: note.content.slice(0, 12_000) });

/**
 * Calcula y guarda el embedding de una nota. Se llama con after(): no retrasa la respuesta.
 * Concurrencia optimista: si la nota se editó mientras tanto (cambió updated_at), no se escribe
 * un embedding del texto viejo; el trigger ya lo dejó en null y el backfill lo recalculará.
 */
export async function embedNote(db: DbClient, noteId: string, userId?: string): Promise<void> {
  const { data: note } = await db.from('notes').select('id, title, content, updated_at').eq('id', noteId).single();
  if (!note) return;

  const startedAt = performance.now();
  try {
    const { embedding, usage } = await embed({
      model: models.embedding,
      value: noteText(note),
      providerOptions: embeddingOptions,
    });
    await db
      .from('notes')
      .update({ embedding: toVector(embedding), embedding_model: MODEL_TAG, embedded_at: new Date().toISOString() })
      .eq('id', note.id)
      .eq('updated_at', note.updated_at);
    await recordAiRun(db, {
      task: 'embedding',
      model: EMBEDDING_MODEL,
      status: 'ok',
      startedAt,
      embeddingTokens: usage.tokens,
      subject: { table: 'notes', id: note.id },
      userId,
    });
  } catch (error) {
    await recordAiRun(db, {
      task: 'embedding',
      model: EMBEDDING_MODEL,
      status: 'error',
      startedAt,
      errorCode: errorCode(error),
      subject: { table: 'notes', id: note.id },
      userId,
    });
  }
}

/** Red de seguridad: embebe en lote las notas que se quedaron sin vector (fallo, edición, datos antiguos). */
export async function backfillEmbeddings(db: DbClient, userId: string, limit = 50): Promise<number> {
  const { data: pending } = await db
    .from('notes')
    .select('id, title, content, updated_at')
    .eq('user_id', userId)
    .is('embedding', null)
    .limit(limit);
  if (!pending?.length) return 0;

  const startedAt = performance.now();
  try {
    const { embeddings, usage } = await embedMany({
      model: models.embedding,
      values: pending.map(noteText),
      providerOptions: embeddingOptions,
      maxParallelCalls: 2,
    });
    await Promise.all(
      pending.map((note, index) =>
        db
          .from('notes')
          .update({
            embedding: toVector(embeddings[index]!),
            embedding_model: MODEL_TAG,
            embedded_at: new Date().toISOString(),
          })
          .eq('id', note.id)
          .eq('updated_at', note.updated_at),
      ),
    );
    await recordAiRun(db, {
      task: 'embedding',
      model: EMBEDDING_MODEL,
      status: 'ok',
      startedAt,
      embeddingTokens: usage.tokens,
      userId,
    });
    return pending.length;
  } catch (error) {
    await recordAiRun(db, {
      task: 'embedding',
      model: EMBEDDING_MODEL,
      status: 'error',
      startedAt,
      errorCode: errorCode(error),
      userId,
    });
    return 0;
  }
}
