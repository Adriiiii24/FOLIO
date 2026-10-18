import Link from 'next/link';
import { monthName } from '@/lib/format';
import { Icon } from './Icon';

function shift(month: string, delta: number): string {
  const [year = 1970, m = 1] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

const LINK =
  'inline-flex h-11 min-w-11 items-center justify-center border-2 border-steel px-3 font-mono text-label uppercase hover:border-white';

/** Mes anterior / siguiente. No se navega al futuro: el siguiente del mes actual no existe. */
export function MonthNav({
  month,
  currentMonth,
  basePath,
  param = 'mes',
}: {
  month: string;
  currentMonth: string;
  basePath: string;
  param?: string;
}) {
  const previous = shift(month, -1);
  const next = shift(month, 1);

  return (
    // El mes ocupa lo que dejan las flechas, hasta 20rem: con un mínimo fijo de 160 px, a 320 px de ancho la fila no
    // cabía en la ficha (WCAG 1.4.10). Con el mismo ancho, las flechas no bailan al cambiar de mes.
    <nav aria-label="Cambiar de mes" className="flex max-w-xs items-center gap-2">
      <Link
        href={`${basePath}?${param}=${previous}`}
        scroll={false}
        className={LINK}
        aria-label={`Mes anterior: ${monthName(`${previous}-01`)}`}
      >
        <Icon name="chevron-left" />
      </Link>
      <p className="min-w-0 flex-1 text-center font-mono text-label uppercase" aria-live="polite">
        {monthName(`${month}-01`)}
      </p>
      {month < currentMonth ? (
        <Link
          href={`${basePath}?${param}=${next}`}
          scroll={false}
          className={LINK}
          aria-label={`Mes siguiente: ${monthName(`${next}-01`)}`}
        >
          <Icon name="chevron-right" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${LINK} border-line text-line`}>
          <Icon name="chevron-right" />
        </span>
      )}
    </nav>
  );
}
