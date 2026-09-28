import { formatIndex, TABS, type TabSlug } from '@/config/tabs';

/**
 * Cabecera de lámina: índice y módulo a la izquierda, contexto a la derecha, en mono de 11 px (§4.1).
 * Es el h1 de la página: «03 Finanzas» para lectores de pantalla.
 */
export function SheetHeader({ tab, meta }: { tab: TabSlug; meta?: string }) {
  const entry = TABS.find((item) => item.slug === tab);
  if (!entry) return null;

  return (
    <header className="col-span-full flex items-center justify-between gap-4 font-mono text-micro text-ash uppercase">
      <h1 className="flex items-center gap-2">
        <span aria-hidden="true" className="size-2 rounded-full bg-brand-orange" />
        <span>{formatIndex(entry.index)}</span>
        <span aria-hidden="true">{'//'}</span>
        <span>{entry.label}</span>
      </h1>
      {meta ? <p className="text-right">{meta}</p> : null}
    </header>
  );
}
