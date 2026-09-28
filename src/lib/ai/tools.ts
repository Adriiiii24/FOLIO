import 'server-only';
import { embed, tool } from 'ai';
import { z } from 'zod';
import { localDayRangeUtc } from '@/lib/dates';
import type { DbClient } from '@/lib/supabase/types';
import { asQuery, embeddingOptions, models } from './models';
import { CATEGORY_LABEL, TRANSACTION_CATEGORIES } from './schemas/ticket';

const isoDate = z.iso.date().describe('Fecha ISO YYYY-MM-DD');
const range = { from: isoDate, to: isoDate };

/**
 * Herramientas del chat. Todas de SOLO LECTURA y todas ejecutadas con la sesión del usuario, así que RLS
 * aplica en cada consulta. El modelo nunca escribe SQL: elige una función y sus parámetros, validados por Zod.
 * Cada resultado lleva el periodo consultado: la interfaz lo enseña como evidencia.
 */
export function buildTools(db: DbClient, { timeZone }: { timeZone: string }) {
  const between = (from: string, to: string) => localDayRangeUtc(from, to, timeZone);

  return {
    searchJournal: tool({
      description:
        'Busca en el diario por significado y por palabras. Para recuerdos, emociones, sucesos o cualquier texto libre.',
      inputSchema: z.object({
        query: z.string().min(2).max(200),
        from: isoDate.optional(),
        to: isoDate.optional(),
        limit: z.number().int().min(1).max(12).default(6),
      }),
      execute: async ({ query, from, to, limit }) => {
        let embedding: number[] | null = null;
        try {
          ({ embedding } = await embed({
            model: models.embedding,
            value: asQuery(query),
            providerOptions: embeddingOptions,
          }));
        } catch {
          // Sin embedding (cuota o saturación), la búsqueda sigue por palabras.
        }
        if (!embedding) {
          let request = db
            .from('notes')
            .select('id, entry_date, title, content, tags')
            .textSearch('fts', query, { type: 'websearch', config: 'public.spanish_unaccent' })
            .order('entry_date', { ascending: false })
            .limit(limit);
          if (from) request = request.gte('entry_date', from);
          if (to) request = request.lte('entry_date', to);
          const { data, error } = await request;
          if (error) return { error: 'search_failed' as const };
          return {
            mode: 'words' as const,
            notes: data.map((note) => ({
              id: note.id,
              date: note.entry_date,
              title: note.title,
              excerpt: note.content.slice(0, 240),
              tags: note.tags,
            })),
          };
        }
        const { data, error } = await db.rpc('hybrid_search_notes', {
          query_text: query,
          query_embedding: JSON.stringify(embedding),
          match_count: limit,
          date_from: from,
          date_to: to,
        });
        if (error) return { error: 'search_failed' as const };
        return {
          mode: 'hybrid' as const,
          notes: data.map((note) => ({
            id: note.id,
            date: note.entry_date,
            title: note.title,
            excerpt: note.excerpt,
            tags: note.tags,
          })),
        };
      },
    }),

    getSpendingSummary: tool({
      description:
        'Totales de gasto e ingreso por categoría en un rango de fechas. Para cualquier pregunta de «cuánto».',
      inputSchema: z.object(range),
      execute: async ({ from, to }) => {
        const { data, error } = await db.rpc('spending_summary', { p_from: from, p_to: to });
        if (error) return { error: 'query_failed' as const };
        // La etiqueta en español va junto al código: el modelo la usa al redactar («Vivienda», no «housing»).
        return { from, to, rows: data.map((row) => ({ ...row, categoryLabel: CATEGORY_LABEL[row.category] })) };
      },
    }),

    listTransactions: tool({
      description:
        'Movimientos concretos (fecha, importe, comercio, categoría) de un rango, opcionalmente de una categoría.',
      inputSchema: z.object({
        ...range,
        category: z.enum(TRANSACTION_CATEGORIES).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ from, to, category, limit }) => {
        const { fromIso, toIso } = between(from, to);
        let query = db
          .from('financial_transactions')
          .select('id, occurred_at, kind, amount, currency, category, merchant')
          .gte('occurred_at', fromIso)
          .lt('occurred_at', toIso)
          .order('occurred_at', { ascending: false })
          .limit(limit);
        if (category) query = query.eq('category', category);
        const { data, error } = await query;
        if (error) return { error: 'query_failed' as const };
        return {
          from,
          to,
          timeZone,
          transactions: data.map((row) => ({ ...row, categoryLabel: CATEGORY_LABEL[row.category] })),
        };
      },
    }),

    getTrainingProgress: tool({
      description:
        'Progresión de un ejercicio por sesión: mejor peso, 1RM estimado y volumen. Si no sabes el nombre exacto, usa antes listExercises.',
      inputSchema: z.object({ exercise: z.string().min(2).max(80), from: isoDate.optional() }),
      execute: async ({ exercise, from }) => {
        const { data, error } = await db.rpc('exercise_progress', { p_exercise: exercise, p_from: from });
        return error ? { error: 'query_failed' as const } : { exercise, sessions: data };
      },
    }),

    listWorkouts: tool({
      description:
        'Sesiones de entrenamiento de un rango con inicio, fin y esfuerzo percibido. Para cruzar el entreno con el ánimo o el gasto.',
      inputSchema: z.object(range),
      execute: async ({ from, to }) => {
        const { fromIso, toIso } = between(from, to);
        const { data, error } = await db
          .from('workouts')
          .select('id, title, started_at, ended_at, perceived_effort')
          .gte('started_at', fromIso)
          .lt('started_at', toIso)
          .order('started_at');
        return error ? { error: 'query_failed' as const } : { from, to, timeZone, workouts: data };
      },
    }),

    listExercises: tool({
      description: 'Nombres de los ejercicios registrados, para elegir el exacto antes de pedir su progresión.',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db.from('workout_logs').select('exercise').limit(1000);
        if (error) return { error: 'query_failed' as const };
        return { exercises: [...new Set(data.map((row) => row.exercise.toLocaleLowerCase('es')))].sort() };
      },
    }),

    getNutritionSummary: tool({
      description: 'Kcal y macros por día frente a los objetivos del perfil.',
      inputSchema: z.object(range),
      execute: async ({ from, to }) => {
        const { data, error } = await db.rpc('nutrition_daily', { p_from: from, p_to: to });
        return error ? { error: 'query_failed' as const } : { from, to, days: data };
      },
    }),

    getHabitStats: tool({
      description: 'Cumplimiento de cada hábito en un rango y su racha actual.',
      inputSchema: z.object(range),
      execute: async ({ from, to }) => {
        const { data, error } = await db.rpc('habit_stats', { p_from: from, p_to: to });
        return error ? { error: 'query_failed' as const } : { from, to, habits: data };
      },
    }),

    getFocusStats: tool({
      description: 'Sesiones y minutos de foco por día, con interrupciones.',
      inputSchema: z.object(range),
      execute: async ({ from, to }) => {
        const { data, error } = await db.rpc('focus_stats', { p_from: from, p_to: to });
        return error ? { error: 'query_failed' as const } : { from, to, days: data };
      },
    }),

    searchMedia: tool({
      description: 'Busca libros, películas, series, podcasts, juegos o álbumes por título, autor o reseña.',
      inputSchema: z.object({
        query: z.string().min(2).max(100),
        status: z.enum(['backlog', 'in_progress', 'done', 'dropped']).optional(),
      }),
      execute: async ({ query, status }) => {
        // Fuera los caracteres con significado en la sintaxis de filtros de PostgREST.
        const term = query.replace(/[,()*%\\.:]/g, ' ').trim();
        let request = db
          .from('media_items')
          .select('id, kind, title, creator, status, rating, finished_on, review')
          .or(`title.ilike.*${term}*,creator.ilike.*${term}*,review.ilike.*${term}*`)
          .limit(20);
        if (status) request = request.eq('status', status);
        const { data, error } = await request;
        return error ? { error: 'query_failed' as const } : { query, items: data };
      },
    }),
  };
}

export type FolioTools = ReturnType<typeof buildTools>;
