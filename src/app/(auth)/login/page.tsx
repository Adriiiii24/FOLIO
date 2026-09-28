import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SubmitButton } from '@/components/ui/FormControls';
import { formatIndex, TABS } from '@/config/tabs';
import { safeNextPath } from '@/lib/auth/safe-next';
import { createClient, requireUserId } from '@/lib/supabase/server';
import { signInWithGoogle } from '@/modules/auth/actions';
import { MagicLinkForm } from './magic-link-form';

export const metadata: Metadata = { title: 'Entrar' };

const MESSAGES: Record<string, { text: string; tone: 'error' | 'info' }> = {
  auth: { text: 'No se ha podido completar el acceso con Google. Inténtalo otra vez.', tone: 'error' },
  oauth: { text: 'No se ha podido abrir el acceso con Google. Inténtalo otra vez.', tone: 'error' },
  link: { text: 'El enlace no es válido o ya se ha usado. Pide otro.', tone: 'error' },
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === 'string' ? params.next : null);
  const message =
    typeof params.error === 'string'
      ? MESSAGES[params.error]
      : params.cuenta === 'borrada'
        ? { text: 'Tu cuenta y todos tus datos se han borrado.', tone: 'info' as const }
        : undefined;

  // Con sesión, el login no tiene nada que hacer.
  if (await requireUserId(await createClient())) redirect(next);

  return (
    <div data-surface="canvas" className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 font-mono text-micro uppercase md:px-6 lg:px-8">
        <p className="font-semibold tracking-[0.14em]">FOLIO</p>
        <p>Sistema operativo personal</p>
      </header>

      <main className="mx-auto grid w-full max-w-6xl content-center gap-10 px-4 py-10 md:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8">
        <div className="flex flex-col justify-center gap-6 lg:col-span-7">
          <h1 className="font-display text-headline font-bold text-balance">Tu vida, archivada en ocho carpetas.</h1>
          <p className="max-w-[48ch] text-body">
            Entreno, dinero, diario, comidas, lo que lees y ves, y tus hábitos, en un solo archivador. Registras con una
            frase; FOLIO la convierte en un borrador y tú confirmas.
          </p>
        </div>

        <section
          data-surface="paper"
          aria-labelledby="acceso"
          className="flex flex-col gap-6 border-2 border-black p-5 shadow-hard lg:col-span-5 lg:self-center"
        >
          <h2 id="acceso" className="font-mono text-micro uppercase">
            Entrar o crear cuenta
          </h2>
          {message ? (
            <p
              role={message.tone === 'error' ? 'alert' : 'status'}
              className="border-2 border-black px-3 py-2 text-small font-semibold"
            >
              {message.text}
            </p>
          ) : null}
          <MagicLinkForm next={next} />
          <div className="flex items-center gap-3 font-mono text-micro text-steel uppercase">
            <span aria-hidden="true" className="h-0.5 flex-1 bg-black" />o
            <span aria-hidden="true" className="h-0.5 flex-1 bg-black" />
          </div>
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <SubmitButton tone="secondary" surface="paper" pendingLabel="Abriendo Google…" className="w-full">
              Entrar con Google
            </SubmitButton>
          </form>
          <p className="text-small text-steel">
            Sin contraseñas. Tus datos son solo tuyos: puedes exportarlos o borrarlos cuando quieras.
          </p>
        </section>
      </main>

      <footer
        data-surface="folder"
        className="@container overflow-hidden px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6 lg:px-8"
      >
        {/* Llena el ancho: «FOLIO» mide 2,633 em con −0,04em (medido); /2,7 deja el margen del último glifo. */}
        <p
          aria-hidden="true"
          className="font-display text-[calc(100cqi/2.7)] leading-[0.8] font-bold tracking-[-0.04em] text-white"
        >
          FOLIO
        </p>
        <ol
          aria-label="Las ocho carpetas"
          className="mt-6 grid grid-cols-4 gap-x-4 gap-y-2 font-mono text-micro text-ash uppercase md:grid-cols-8"
        >
          {TABS.map((tab) => (
            <li key={tab.slug}>
              {formatIndex(tab.index)} <span lang="en">{tab.label}</span>
            </li>
          ))}
        </ol>
      </footer>
    </div>
  );
}
