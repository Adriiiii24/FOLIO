'use client';

import * as m from 'motion/react-m';
import Link from 'next/link';
import { useEffect } from 'react';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { buttonClass } from '@/components/ui/Button';
import { Signal } from '@/components/ui/Signal';
import { formatIndex, TABS } from '@/config/tabs';
import { STAGGER_S, springSheet } from '@/lib/motion/tokens';
import { markBriefingRead } from '@/modules/home/actions';
import type { BriefingView } from '@/modules/home/briefing/queries';

const list = { hidden: {}, shown: { transition: { staggerChildren: STAGGER_S } } };
const item = { hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0, transition: springSheet } };

const SEVERITY = {
  warning: { tone: 'warn', glyph: '!', label: 'Atención' },
  positive: { tone: 'up', glyph: '▲', label: 'Bien' },
  info: { tone: 'neutral', glyph: '●', label: 'Dato' },
} as const;

const prefill = (text: string, ask: boolean) =>
  window.dispatchEvent(new CustomEvent('folio:prefill', { detail: { text, ask } }));

/**
 * El briefing de la mañana (PROPOSAL §3.5). Las cifras las calculó SQL; el modelo solo redactó. La primera
 * vez que se ve cada día, los hallazgos entran en cascada (DESIGN_SYSTEM §6.5); nunca bloquea la interacción.
 */
export function BriefingCard({ briefing }: { briefing: BriefingView }) {
  const { id, firstViewToday } = briefing;
  useEffect(() => {
    if (firstViewToday) void markBriefingRead(id);
  }, [id, firstViewToday]);

  return (
    <BrutalistCard title="Briefing de hoy" eyebrow={`${briefing.insights.length} hallazgos`} className="col-span-full">
      <p className="max-w-[28ch] font-display text-headline font-bold text-balance">{briefing.headline}</p>
      <m.ol
        variants={list}
        initial={firstViewToday ? 'hidden' : false}
        animate="shown"
        className="mt-6 grid gap-0 border-t-2 border-line"
      >
        {briefing.insights.map((insight) => {
          const tab = TABS.find((entry) => entry.slug === insight.module)!;
          const severity = SEVERITY[insight.severity];
          return (
            <m.li
              key={insight.id}
              variants={item}
              className="grid gap-3 border-b-2 border-line py-4 @xl:grid-cols-[10rem_minmax(0,1fr)_auto] @xl:items-center"
            >
              <div className="flex flex-wrap items-center gap-2 @xl:flex-col @xl:items-start">
                <span className="font-mono text-label text-ash uppercase">
                  {formatIndex(tab.index)} <span aria-hidden="true">{'//'}</span> <span lang="en">{tab.label}</span>
                </span>
                <Signal tone={severity.tone} glyph={severity.glyph}>
                  {severity.label}
                </Signal>
              </div>
              <p className="max-w-[65ch] text-body">{insight.text}</p>
              <InsightAction action={insight.action} />
            </m.li>
          );
        })}
      </m.ol>
      {briefing.reflection ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[65ch] text-body text-ash">{briefing.reflection}</p>
          <button
            type="button"
            className={buttonClass({ tone: 'secondary' })}
            onClick={() => prefill(`${briefing.reflection} `, false)}
          >
            Escribir en el diario
          </button>
        </div>
      ) : null}
    </BrutalistCard>
  );
}

function InsightAction({ action }: { action: BriefingView['insights'][number]['action'] }) {
  const className = buttonClass({ tone: 'secondary', className: 'justify-self-start' });
  if (action.kind === 'open') {
    return (
      <Link href={action.payload} className={className}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={() => prefill(action.payload, action.kind === 'ask')}>
      {action.label}
    </button>
  );
}
