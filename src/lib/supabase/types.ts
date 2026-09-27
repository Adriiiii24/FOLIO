import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/** Cualquier cliente tipado: el de la sesión del usuario (RLS) o el administrativo (sin RLS). */
export type DbClient = SupabaseClient<Database>;
