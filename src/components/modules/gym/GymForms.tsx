'use client';

import { useActionState, useEffect, useState, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { FormMessage, SubmitButton } from '@/components/ui/FormControls';
import { FormShell, type Saved } from '@/components/ui/FormShell';
import { IDLE, type FormState } from '@/lib/action-result';
import { addQuickSets, addSets, saveWorkout, startWorkout } from '@/modules/gym/actions';

/** Empezar sesión: un toque. El nombre es opcional («Entreno del jueves» si no se escribe). */
export function StartWorkoutForm() {
  return (
    <FormShell
      action={startWorkout}
      submitLabel="Empezar sesión"
      pendingLabel="Empezando…"
      className="flex flex-col gap-4"
    >
      {(errors) => (
        <TextField
          label="Nombre (opcional)"
          name="title"
          autoComplete="off"
          placeholder="Pierna, empuje…"
          error={errors.title}
        />
      )}
    </FormShell>
  );
}

export type SetValues = { exercise: string; count: string; reps: string; weightKg: string; rpe: string };

type SetFormProps = {
  /** Sesión abierta. Sin ella (borrador de la barra), la acción usa o crea la sesión de hoy. */
  workoutId?: string;
  initial?: Partial<SetValues>;
  exercises: readonly string[];
  surface?: 'folder' | 'paper';
  submitLabel?: string;
  onSaved?: (state: Saved) => void;
  secondaryAction?: ReactNode;
};

export function SetForm({
  workoutId,
  initial,
  exercises,
  surface,
  submitLabel = 'Añadir series',
  onSaved,
  secondaryAction,
}: SetFormProps) {
  const listId = `ejercicios-${workoutId ?? 'borrador'}`;
  return (
    <FormShell
      action={workoutId ? addSets : addQuickSets}
      submitLabel={submitLabel}
      pendingLabel="Añadiendo…"
      surface={surface}
      onSaved={onSaved}
      secondaryAction={secondaryAction}
      className="grid grid-cols-2 gap-4 @lg:grid-cols-6"
    >
      {(errors) => (
        <>
          {workoutId ? <input type="hidden" name="workoutId" value={workoutId} /> : null}
          <TextField
            label="Ejercicio"
            name="exercise"
            list={listId}
            autoComplete="off"
            placeholder="Sentadilla"
            defaultValue={initial?.exercise ?? ''}
            error={errors.exercise}
            className="col-span-2"
            required
          />
          <datalist id={listId}>
            {exercises.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <TextField
            label="Series"
            name="count"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={initial?.count ?? '1'}
            error={errors.count}
          />
          <TextField
            label="Reps"
            name="reps"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={initial?.reps ?? ''}
            error={errors.reps}
            required
          />
          <TextField
            label="Peso (kg)"
            name="weightKg"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={initial?.weightKg ?? ''}
            error={errors.weightKg}
            required
          />
          <TextField
            label="RPE"
            name="rpe"
            inputMode="decimal"
            autoComplete="off"
            placeholder="1–10"
            defaultValue={initial?.rpe ?? ''}
            error={errors.rpe}
          />
          <label className="col-span-2 flex min-h-11 items-center gap-3 text-small @lg:col-span-6">
            <input type="checkbox" name="isWarmup" className="size-5" />
            Serie de calentamiento (no cuenta para el volumen ni los récords)
          </label>
        </>
      )}
    </FormShell>
  );
}

export type WorkoutValues = { id: string; title: string; startedAt: string; perceivedEffort: string; notes: string };

export function WorkoutEditForm({
  initial,
  doneHref,
  secondaryAction,
}: {
  initial: WorkoutValues;
  doneHref: string;
  secondaryAction?: ReactNode;
}) {
  return (
    <FormShell action={saveWorkout} submitLabel="Guardar cambios" doneHref={doneHref} secondaryAction={secondaryAction}>
      {(errors) => (
        <>
          <input type="hidden" name="id" value={initial.id} />
          <TextField
            label="Nombre"
            name="title"
            autoComplete="off"
            defaultValue={initial.title}
            error={errors.title}
            required
          />
          <TextField
            label="Inicio"
            name="startedAt"
            type="datetime-local"
            defaultValue={initial.startedAt}
            error={errors.startedAt}
            required
          />
          <TextField
            label="Esfuerzo percibido (1–10)"
            name="perceivedEffort"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={initial.perceivedEffort}
            error={errors.perceivedEffort}
          />
          <TextAreaField
            label="Notas"
            name="notes"
            defaultValue={initial.notes}
            error={errors.notes}
            rows={3}
            className="@md:col-span-2"
          />
        </>
      )}
    </FormShell>
  );
}

/** Botón de una sola acción de servidor (repetir serie, terminar sesión…) con su resultado anunciado. */
export function ActionButton({
  action,
  children,
  pendingLabel,
  tone = 'secondary',
}: {
  action: () => Promise<FormState>;
  children: ReactNode;
  pendingLabel: string;
  tone?: 'primary' | 'secondary';
}) {
  const [state, dispatch] = useActionState(async () => action(), IDLE);
  return (
    <form action={dispatch} className="flex flex-wrap items-center gap-3">
      <SubmitButton tone={tone} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
      {state.status === 'error' ? <FormMessage state={state} /> : null}
    </form>
  );
}

const PRESETS = [60, 90, 120, 180];

/** Descanso entre series: cuenta atrás en el cliente, sin red. Al terminar, lo anuncia y vibra si puede. */
export function RestTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) {
        clearInterval(timer);
        setEndsAt(null);
        navigator.vibrate?.(200);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [endsAt]);

  const left = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="font-mono text-label text-ash uppercase">Descanso</p>
      {endsAt === null ? (
        PRESETS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            onClick={() => {
              setNow(Date.now());
              setEndsAt(Date.now() + seconds * 1000);
            }}
            className={buttonClass({ tone: 'secondary' })}
          >
            {seconds < 120 ? `${seconds} s` : `${seconds / 60} min`}
          </button>
        ))
      ) : (
        <>
          <p className="min-w-16 font-mono text-title tabular-nums" aria-hidden="true">
            {clock}
          </p>
          <button type="button" onClick={() => setEndsAt(null)} className={buttonClass({ tone: 'secondary' })}>
            Parar
          </button>
        </>
      )}
      <p role="status" className="sr-only">
        {endsAt === null ? '' : `Descanso en marcha: ${clock}`}
      </p>
    </div>
  );
}
