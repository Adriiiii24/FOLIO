import Link from 'next/link';
import type { ReactNode } from 'react';
import { FolioMark } from '@/components/ui/FolioMark';

export const LEGAL_CONTACT = 'folio.app.soporte@gmail.com';
export const LEGAL_UPDATED = '28 de septiembre de 2026';

const LINKS = [
  { href: '/login', label: 'Entrar' },
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/terminos', label: 'Condiciones' },
] as const;

/**
 * Páginas legales públicas (Google las exige para publicar el acceso con Google). Mesa naranja y una lámina
 * negra de lectura, como el acceso: se leen sin sesión y enlazan entre sí.
 */
export function LegalPage({ title, path, children }: { title: string; path: string; children: ReactNode }) {
  return (
    <div data-surface="canvas" className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 font-mono text-micro uppercase md:px-6 lg:px-8">
        <Link
          href="/login"
          className="flex items-center gap-2 font-semibold tracking-[0.14em] underline-offset-4 hover:underline"
        >
          <FolioMark className="h-3 w-auto" />
          FOLIO
        </Link>
        <p>Sistema operativo personal</p>
      </header>

      <main className="px-2 pb-8 md:px-6 lg:px-8">
        <article
          data-surface="folder"
          className="mx-auto max-w-3xl border-2 border-black px-5 py-8 md:px-10 md:py-12 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-ash"
        >
          <p className="font-mono text-micro text-ash uppercase">Actualizada el {LEGAL_UPDATED}</p>
          <h1 className="mt-4 font-display text-headline font-bold text-balance">{title}</h1>
          <div className="mt-8 grid gap-8">{children}</div>
        </article>
      </main>

      <footer className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6 lg:px-8">
        <nav aria-label="Información legal" className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-micro uppercase">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === path ? 'page' : undefined}
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline aria-[current=page]:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}

/** Un apartado: raya superior, título y texto a 65 caracteres de medida. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t-2 border-line pt-6">
      <h2 className="text-title font-semibold">{title}</h2>
      <div className="grid max-w-[65ch] gap-4 text-body">{children}</div>
    </section>
  );
}

/** Lista con viñeta cuadrada: el sistema no tiene curvas salvo el punto de estado. */
export function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="grid gap-3 [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:top-[0.6em] [&>li]:before:left-0 [&>li]:before:size-1.5 [&>li]:before:bg-ash">
      {children}
    </ul>
  );
}

export function ContactEmail() {
  return <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>;
}
