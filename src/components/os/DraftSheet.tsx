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
import type { InterpretedDraft } from '@/modules/quick/actions';
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
  const { context } = draft;

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
          initial={{ description: draft.values.description }}
          defaultEatenAt={context.now}
          defaultMealType={context.mealType}
          submitLabel="Guardar comida"
          onSaved={saved(deleteMeal)}
          secondaryAction={discard}
        />
      );
      break;
    case 'note':
      form = (
        <NoteForm
          surface="paper"
          initial={{ content: draft.values.content }}
          defaultEntryDate={context.today}
          submitLabel="Guardar entrada"
          onSaved={saved(deleteNote)}
          secondaryAction={discard}
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
      className="@container max-h-[min(68dvh,42rem)] overflow-y-auto overscroll-contain border-2 border-black bg-white p-4 text-black shadow-hard"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2 font-mono text-micro uppercase">
        <h2 id={titleId}>Borrador · revisa antes de guardar</h2>
        <p className="text-steel">Texto · {KIND_LABEL[draft.kind]}</p>
      </header>
      {form}
    </section>
  );
}
