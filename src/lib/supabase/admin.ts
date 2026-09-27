import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Clave secreta: SALTA RLS. Solo la usa el job programado (briefing, backfill de embeddings),
 * que filtra siempre por user_id de forma explícita. Nunca en rutas interactivas.
 */
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
