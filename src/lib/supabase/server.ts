import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/** Cliente con la sesión del usuario: todo lo que hace pasa por RLS. Uno nuevo por petición. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
          } catch {
            // Llamado desde un Server Component, que no puede escribir cookies: el proxy ya refresca la sesión.
          }
        },
      },
    },
  );
}

/** Id del usuario autenticado. getClaims() verifica la firma del JWT; getSession() no. */
export async function requireUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}
