import type { ReactNode } from 'react';

type Tone = 'up' | 'down' | 'warn' | 'neutral';

const TONE: Record<Tone, string> = {
  up: 'border-signal-up text-signal-up',
  down: 'border-signal-down text-signal-down',
  warn: 'border-signal-warn text-signal-warn',
  neutral: 'border-steel text-ash',
};

const GLYPH: Record<Tone, string> = { up: '▲', down: '▼', warn: '!', neutral: '●' };

/**
 * Señal de estado: color SIEMPRE acompañado de glifo y texto (§2.5; rojo y verde se confunden con
 * deuteranopía). `glyph` permite invertir la flecha cuando «bajar» es la buena noticia.
 */
export function Signal({ tone, glyph, children }: { tone: Tone; glyph?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 px-1.5 py-0.5 font-mono text-label uppercase ${TONE[tone]}`}
    >
      <span aria-hidden="true">{glyph ?? GLYPH[tone]}</span>
      {children}
    </span>
  );
}
