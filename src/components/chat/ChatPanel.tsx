'use client';

import type { ChatStatus, InferUITools, UIDataTypes, UIMessage } from 'ai';
import Link from 'next/link';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CATEGORY_LABEL } from '@/lib/ai/schemas/ticket';
import type { FolioTools } from '@/lib/ai/tools';
import { money, plural, shortDate } from '@/lib/format';

// Solo tipos: el módulo de herramientas es server-only y nunca llega al cliente.
export type FolioMessage = UIMessage<never, UIDataTypes, InferUITools<FolioTools>>;

type ChatPanelProps = {
  messages: FolioMessage[];
  status: ChatStatus;
  error: string | null;
  onStop: () => void;
  onClose: () => void;
};

const PENDING: Record<string, string> = {
  'tool-searchJournal': 'Buscando en el diario',
  'tool-getSpendingSummary': 'Sumando gastos',
  'tool-listTransactions': 'Buscando movimientos',
  'tool-getTrainingProgress': 'Leyendo la progresión',
  'tool-listWorkouts': 'Buscando entrenos',
  'tool-listExercises': 'Listando ejercicios',
  'tool-getNutritionSummary': 'Sumando comidas',
  'tool-getHabitStats': 'Contando hábitos',
  'tool-getFocusStats': 'Contando el foco',
  'tool-searchMedia': 'Buscando en tu cultura',
};

const EVIDENCE: Record<string, string> = {
  'tool-listWorkouts': 'Entrenos',
  'tool-listExercises': 'Ejercicios registrados',
  'tool-getTrainingProgress': 'Progresión del ejercicio',
  'tool-getNutritionSummary': 'Comidas por día',
  'tool-getHabitStats': 'Hábitos',
  'tool-getFocusStats': 'Foco por día',
  'tool-searchMedia': 'Cultura',
};

/**
 * Respuestas del modo PREGUNTAR, encima de la barra. Superficie oscura (se lee, no se decide).
 * Las cifras llegan de las herramientas: cada resultado se enseña como evidencia junto a la respuesta.
 */
export function ChatPanel({ messages, status, error, onStop, onClose }: ChatPanelProps) {
  const titleId = useId();
  const end = useRef<HTMLDivElement>(null);
  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages, status]);

  return (
    <section
      data-surface="folder"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
      className="max-h-[min(60dvh,36rem)] overflow-y-auto overscroll-contain border-2 border-white bg-structure p-4 text-white shadow-hard"
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="font-mono text-micro text-ash uppercase">
          Pregunta a tu archivador · solo lectura
        </h2>
        <div className="flex gap-2">
          {busy ? <PanelButton onClick={onStop}>Parar</PanelButton> : null}
          <PanelButton onClick={onClose}>Cerrar</PanelButton>
        </div>
      </header>

      <ol aria-live="polite" className="grid gap-5">
        {messages.map((message) => (
          <li key={message.id} className="grid gap-3">
            {message.role === 'user' ? (
              <p className="max-w-[65ch] border-l-2 border-steel pl-3 text-body text-ash">{textOf(message)}</p>
            ) : (
              message.parts.map((part, index) => <Part key={index} part={part} />)
            )}
          </li>
        ))}
      </ol>

      {status === 'submitted' ? <Pending label="Pensando" /> : null}
      {error ? (
        <p role="alert" className="mt-4 text-small text-signal-down">
          {error}
        </p>
      ) : null}
      <div ref={end} />
    </section>
  );
}

function PanelButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 border-2 border-steel px-3 font-mono text-label uppercase hover:border-white"
    >
      {children}
    </button>
  );
}

const textOf = (message: FolioMessage) =>
  message.parts.reduce((text, part) => (part.type === 'text' ? text + part.text : text), '');

function Pending({ label }: { label: string }) {
  return (
    <p className="font-mono text-micro text-ash uppercase">
      {label}
      <span aria-hidden="true" className="motion-safe:animate-caret-blink">
        _
      </span>
    </p>
  );
}

function Evidence({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grid gap-2 border-2 border-line p-3">
      <p className="font-mono text-micro text-ash uppercase">
        <span aria-hidden="true">● </span>
        {title}
      </p>
      {children}
    </div>
  );
}

/** Día local del movimiento: con la fecha UTC, un gasto de las 23:30 caería en el día siguiente. */
const dayInZone = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone }).format(new Date(iso));

const period = (from?: string, to?: string) =>
  from && to ? (from === to ? shortDate(from) : `${shortDate(from)} – ${shortDate(to)}`) : 'todo el registro';

function Part({ part }: { part: FolioMessage['parts'][number] }) {
  if (part.type === 'text') {
    return <p className="max-w-[65ch] text-body whitespace-pre-wrap">{part.text}</p>;
  }
  if (!part.type.startsWith('tool-')) return null;
  const tool = part as Extract<FolioMessage['parts'][number], { type: `tool-${string}` }>;
  if (tool.state === 'input-streaming' || tool.state === 'input-available') {
    return <Pending label={PENDING[tool.type] ?? 'Consultando'} />;
  }
  if (tool.state !== 'output-available' || 'error' in tool.output) {
    return <Evidence title="No se ha podido consultar este dato" />;
  }

  switch (tool.type) {
    case 'tool-searchJournal':
      // Una búsqueda sin resultados no aporta evidencia: la respuesta ya lo dice.
      if (tool.output.notes.length === 0) return null;
      return (
        <Evidence title={`Diario · ${plural(tool.output.notes.length, 'nota', 'notas')}`}>
          {tool.output.notes.length ? (
            <ul className="grid gap-1 text-small">
              {tool.output.notes.map((note) => (
                <li key={note.id}>
                  <Link href={`/brain?edit=${note.id}`} className="underline underline-offset-4 hover:text-white">
                    {shortDate(note.date)} · {note.title ?? 'Sin título'}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </Evidence>
      );

    case 'tool-getSpendingSummary':
      return (
        <Evidence title={`Por categoría · ${period(tool.output.from, tool.output.to)}`}>
          <Table
            caption={`Totales por categoría, ${period(tool.output.from, tool.output.to)}`}
            rows={tool.output.rows.map((row) => [
              `${CATEGORY_LABEL[row.category]}${row.kind === 'income' ? ' (ingreso)' : ''}`,
              money(Number(row.total)),
            ])}
          />
        </Evidence>
      );

    case 'tool-listTransactions': {
      // Fuera del callback: dentro de map TypeScript pierde el estrechamiento de la unión.
      const { timeZone } = tool.output;
      return (
        <Evidence title={`Movimientos · ${period(tool.output.from, tool.output.to)}`}>
          <Table
            caption={`Movimientos, ${period(tool.output.from, tool.output.to)}`}
            rows={tool.output.transactions.map((row) => [
              `${dayInZone(row.occurred_at, timeZone)} · ${row.merchant ?? CATEGORY_LABEL[row.category]}`,
              `${row.kind === 'income' ? '+' : '−'}${money(Number(row.amount), row.currency)}`,
            ])}
          />
        </Evidence>
      );
    }

    default: {
      const output = tool.output as { from?: string; to?: string };
      return <Evidence title={`${EVIDENCE[tool.type] ?? 'Consulta'} · ${period(output.from, output.to)}`} />;
    }
  }
}

function Table({ caption, rows }: { caption: string; rows: [string, string][] }) {
  if (rows.length === 0) return <p className="text-small text-ash">Sin registros en ese periodo.</p>;
  return (
    <table className="w-full text-small tabular-nums">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {rows.slice(0, 12).map(([label, value], index) => (
          <tr key={index} className="border-t-2 border-line first:border-t-0">
            <th scope="row" className="py-1 pr-3 text-left font-normal">
              {label}
            </th>
            <td className="py-1 text-right">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
