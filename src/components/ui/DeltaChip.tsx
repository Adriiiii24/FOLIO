'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useState } from 'react';
import { exitFast, springSnap } from '@/lib/motion/tokens';

type DeltaChipProps = {
  value: number;
  storageKey: string;
  format?: Intl.NumberFormatOptions;
  upIsGood: boolean;
};

export function DeltaChip({ value, storageKey, format, upIsGood }: DeltaChipProps) {
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    const key = `dossier:last-seen:${storageKey}`;
    let previous: number | null = null;
    try {
      const raw = localStorage.getItem(key);
      previous = raw === null ? null : Number(raw);
      localStorage.setItem(key, String(value));
    } catch {
      return; // Sin almacenamiento no hay delta; la cifra sigue siendo correcta.
    }
    if (previous === null || Number.isNaN(previous) || previous === value) return;

    // El chip aparece en el siguiente fotograma, no dentro del efecto: evita un render en cascada.
    const change = previous;
    const show = requestAnimationFrame(() => setDelta(value - change));
    const hide = setTimeout(() => setDelta(null), 4000);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, [storageKey, value]);

  const favourable = delta !== null && delta > 0 === upIsGood;
  const formatted =
    delta === null ? '' : new Intl.NumberFormat('es-ES', { ...format, signDisplay: 'always' }).format(delta);

  return (
    <AnimatePresence>
      {delta !== null ? (
        <m.span
          key="delta"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: exitFast }}
          transition={springSnap}
          className={`border-2 px-1.5 py-0.5 ${favourable ? 'border-signal-up text-signal-up' : 'border-signal-down text-signal-down'}`}
        >
          <span aria-hidden="true">{delta > 0 ? '▲ ' : '▼ '}</span>
          {formatted}
          <span className="sr-only"> desde tu última visita</span>
        </m.span>
      ) : null}
    </AnimatePresence>
  );
}
