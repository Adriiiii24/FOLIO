'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { safeNextPath } from '@/lib/auth/safe-next';
import { createClient } from '@/lib/supabase/server';

export type MagicLinkState =
  { status: 'idle' } | { status: 'sent'; email: string } | { status: 'error'; message: string };

const EmailSchema = z.email();

/** Origen de la petición (localhost, preview de Vercel o producción): los enlaces de vuelta apuntan a él. */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get('origin');
  if (origin) return origin;
  return `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
}

function nextFrom(formData: FormData): string {
  const next = formData.get('next');
  return safeNextPath(typeof next === 'string' ? next : null);
}

/**
 * Envía el enlace mágico. La plantilla de correo añade `&token_hash=…&type=email` a emailRedirectTo,
 * y /auth/confirm lo canjea. El origen debe estar en la lista de redirecciones permitidas de Supabase.
 */
export async function sendMagicLink(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = EmailSchema.safeParse(String(formData.get('email') ?? '').trim());
  if (!email.success) return { status: 'error', message: 'Escribe un email válido.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: `${await requestOrigin()}/auth/confirm?next=${encodeURIComponent(nextFrom(formData))}`,
    },
  });
  if (error)
    return { status: 'error', message: 'No se ha podido enviar el enlace. Inténtalo de nuevo en unos minutos.' };

  return { status: 'sent', email: email.data };
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${await requestOrigin()}/auth/callback?next=${encodeURIComponent(nextFrom(formData))}` },
  });
  if (error || !data.url) redirect('/login?error=oauth');
  redirect(data.url);
}

/** Cierra la sesión de este dispositivo. Cerrar todas es una opción de 08 // SETTINGS. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/login');
}
