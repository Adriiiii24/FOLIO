'use client';

import { useEffect, useId, useRef } from 'react';
import { NoteForm } from '@/components/modules/brain/NoteForm';
import { SetForm } from '@/components/modules/gym/GymForms';
import { MediaForm } from '@/components/modules/media/MediaForm';
import { MealForm } from '@/components/modules/nutrition/MealForm';
import { HabitQuickForm } from '@/components/modules/routine/RoutineControls';
import { TransactionForm } from '@/components/modules/vault/TransactionForm';
import { Button } from '@/components/ui/Button';
import type { Saved } from '@/components/ui/FormShell';
import type { FormState } from '@/lib/action-result';
import { deleteNote } from '@/modules/brain/actions';
import { deleteSets } from '@/modules/gym/actions';
import { deleteMediaItem } from '@/modules/media/actions';
import { deleteMeal } from '@/modules/nutrition/actions';
import type { AiDraftInfo, InterpretedDraft } from '@/modules/quick/types';
import { deleteHabitLog } from '@/modules/routine/actions';
import { deleteTransaction } from '@/modules/vault/actions';

const KIND_LABEL: Record<InterpretedDraft['kind'], string> = {
  transaction: 'Movimiento',
  sets: 'Series',
  habit: 'Hábito',
  media: 'Ficha',
  meal: 'Comida',
  note: 'Entrada del diario',
};

export type Undo = () => Promise<FormState>;

type DraftSheetProps = {
  draft: InterpretedDraft;
  onSaved: (message: string, undo: Undo | null) => void;
  onDiscard: () => void;
};

/**
 * El borrador (§5.7): papel blanco, porque te toca decidir. Todos los campos se editan en el sitio y nada
 * se guarda hasta pulsar GUARDAR. El foco inicial va al primer campo, nunca al botón: Intro no guarda
 * por accidente. Escape descarta.
 */
export function DraftSheet({ draft, onSaved, onDiscard }: DraftSheetProps) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select')?.focus();
  }, [draft]);

  const discard = (
    <Button tone="secondary" surface="paper" onClick={onDiscard}>
      Descartar
    </Button>
  );
  const saved = (undo: (id: string) => Promise<FormState>) => (state: Saved) =>
    onSaved(state.message, state.id ? () => undo(state.id as string) : null);
  const { context, ai } = draft;
  const aiMeta = ai?.meta ?? undefined;

  let form;
  switch (draft.kind) {
    case 'transaction':
      form = (
        <TransactionForm
          surface="paper"
          initial={draft.values}
          defaultOccurredAt={context.now}
          currency={context.currency}
          submitLabel="Guardar"
          onSaved={saved(deleteTransaction)}
          secondaryAction={discard}
          aiMeta={aiMeta}
        />
      );
      break;
    case 'sets':
      form = (
        <SetForm
          surface="paper"
          exercises={[]}
          initial={{
            exercise: draft.values.exercise,
            count: String(draft.values.count),
            reps: String(draft.values.reps),
            weightKg: draft.values.weightKg,
            rpe: '',
          }}
          submitLabel="Guardar series"
          onSaved={saved((ids) => deleteSets(ids.split(',')))}
          secondaryAction={discard}
        />
      );
      break;
    case 'habit':
      form = (
        <HabitQuickForm
          habitName={draft.values.habitName}
          exists={context.habitExists}
          onSaved={saved(deleteHabitLog)}
          secondaryAction={discard}
        />
      );
      break;
    case 'media':
      form = (
        <MediaForm
          surface="paper"
          compact
          initial={draft.values}
          submitLabel="Guardar ficha"
          onSaved={saved(deleteMediaItem)}
          secondaryAction={discard}
        />
      );
      break;
    case 'meal':
      form = (
        <MealForm
          surface="paper"
          initial={draft.values}
          defaultEatenAt={context.now}
          defaultMealType={context.mealType}
          submitLabel="Guardar comida"
          onSaved={saved(deleteMeal)}
          secondaryAction={discard}
          aiMeta={aiMeta}
        />
      );
      break;
    case 'note':
      form = (
        <NoteForm
          surface="paper"
          initial={draft.values}
          defaultEntryDate={context.today}
          submitLabel="Guardar entrada"
          onSaved={saved(deleteNote)}
          secondaryAction={discard}
          aiMeta={aiMeta}
        />
      );
      break;
  }

  return (
    <section
      ref={ref}
      data-surface="paper"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDiscard();
      }}
      className="draft-sheet @container max-h-[min(68dvh,42rem)] overflow-y-auto overscroll-contain border-2 border-black bg-white p-4 text-black shadow-hard"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2 font-mono text-micro uppercase">
        <h2 id={titleId}>Borrador · revisa antes de guardar</h2>
        <p className="text-steel">
          {ai?.origin ?? 'Texto'} · {KIND_LABEL[draft.kind]}
        </p>
      </header>
      {ai ? <AiReading ai={ai} /> : null}
      {form}
    </section>
  );
}

const CONFIDENCE = [
  { min: 0.8, label: 'alta' },
  { min: 0.6, label: 'media' },
  { min: 0, label: 'baja' },
] as const;

/**
 * Lo que el modelo ha leído y cuánto se fía (§5.7): texto primero, barra después. Por debajo de 0,6
 * lo dice y pide revisar cada campo. Sobre papel, el aviso va en negro con glifo: el amarillo no contrasta.
 */
function AiReading({ ai }: { ai: AiDraftInfo }) {
  if (ai.confidence === null && ai.warnings.length === 0 && !ai.heard) return null;
  const level = ai.confidence === null ? null : CONFIDENCE.find((entry) => ai.confidence! >= entry.min)!;
  return (
    <div className="mb-4 grid gap-3">
      {ai.heard ? (
        <p className="max-w-[65ch] text-small text-steel">
          Has dicho: <q className="text-black">{ai.heard}</q>
        </p>
      ) : null}
      {level && ai.confidence !== null ? (
        <div className="grid gap-1.5">
          <p className="text-small font-semibold">
            {level.label === 'baja' ? <span aria-hidden="true">! </span> : null}
            Confianza {level.label}
            {level.label === 'baja' ? ': revisa cada campo antes de guardar.' : '.'}
          </p>
          <div aria-hidden="true" className="h-2 w-full max-w-48 border-2 border-black">
            <div className="h-full bg-black" style={{ width: `${Math.round(ai.confidence * 100)}%` }} />
          </div>
        </div>
      ) : null}
      {ai.warnings.length > 0 ? (
        <ul aria-label="Avisos" className="grid max-w-[65ch] gap-1 border-l-2 border-black pl-3 text-small">
          {ai.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
