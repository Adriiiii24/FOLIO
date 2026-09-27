import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { safeNextPath } from '@/lib/auth/safe-next';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { signInWithGoogle } from '@/modules/auth/actions';
import { MagicLinkForm } from './magic-link-form';

export const metadata: Metadata = { title: 'Entrar' };

const ERRORS: Record<string, string> = {
  auth: 'No se ha podido completar el acceso con Google.',
  oauth: 'No se ha podido iniciar el acceso con Google.',
  link: 'El enlace no es válido o ha caducado. Pide otro.',
};

// UI provisional: la identidad visual llega en la Fase 2 (DESIGN_SYSTEM.md).
export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === 'string' ? params.next : null);
  const error = typeof params.error === 'string' ? ERRORS[params.error] : undefined;

  // Con sesión, el login no tiene nada que hacer.
  if (await requireUserId(await createClient())) redirect(next);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold">DOSSIER_OS</h1>
      {error && <p role="alert">{error}</p>}
      <MagicLinkForm next={next} />
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="w-full border-2 p-2">
          Entrar con Google
        </button>
      </form>
    </main>
  );
}
