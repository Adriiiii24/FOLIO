'use client';

import { startTransition, useActionState, useEffect, useOptimistic, useState, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { FormMessage } from '@/components/ui/FormControls';
import { FormShell, type Saved } from '@/components/ui/FormShell';
import { Icon } from '@/components/ui/Icon';
import { IDLE, type FormState } from '@/lib/action-result';
import {
  addInterruption,
  deleteFocusSession,
  finishFocus,
  logHabitByName,
  saveHabit,
  setHabitDone,
  startFocus,
} from '@/modules/routine/actions';
import { CADENCE_OPTIONS } from '@/modules/routine/form';

/**
 * Check-in de un hábito. Optimista: la casilla cambia al instante y, si el servidor falla, vuelve sola
 * a su estado real (useOptimistic) y se anuncia el error.
 */
export function HabitToggle({
  habitId,
  name,
  done,
  streak,
  meta,
}: {
  habitId: string;
  name: string;
  done: boolean;
  streak: number;
  meta: string;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !optimisticDone;
    startTransition(async () => {
      setOptimisticDone(next);
      const result = await setHabitDone(habitId, next);
      setError(result.status === 'error' ? result.message : null);
    });
  }

  return (
    <li className="flex items-center gap-4 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={optimisticDone}
        onClick={toggle}
        className={`flex size-11 shrink-0 items-center justify-center border-2 ${optimisticDone ? 'border-white bg-white text-black' : 'border-steel text-transparent hover:border-white'}`}
      >
        <Icon name="check" className="size-5" />
        <span className="sr-only">{name}</span>
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-body ${optimisticDone ? 'text-white' : 'text-ash'}`} aria-hidden="true">
          {name}
        </p>
        <p className="font-mono text-label text-ash uppercase">{meta}</p>
        {error ? (
          <p role="alert" className="text-small text-signal-down">
            {error}
          </p>
        ) : null}
      </div>
      {streak > 0 ? (
        <p className="shrink-0 font-mono text-label text-ash uppercase">
          <span className="text-white">{streak}</span> {streak === 1 ? 'día' : 'días'}
        </p>
      ) : null}
    </li>
  );
}

export type HabitValues = { id?: string; name: string; cadence: string; targetPerPeriod: string };

export function HabitForm({
  initial,
  doneHref,
  secondaryAction,
}: {
  initial?: HabitValues;
  doneHref?: string;
  secondaryAction?: ReactNode;
}) {
  const editing = Boolean(initial?.id);
  return (
    <FormShell
      action={saveHabit}
      submitLabel={editing ? 'Guardar cambios' : 'Crear hábito'}
      resetOnSuccess={!editing}
      doneHref={doneHref}
      secondaryAction={secondaryAction}
      className="grid grid-cols-2 gap-4 @lg:grid-cols-4"
    >
      {(errors) => (
        <>
          {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
          <TextField
            label="Hábito"
            name="name"
            autoComplete="off"
            placeholder="Meditar"
            defaultValue={initial?.name ?? ''}
            error={errors.name}
            className="col-span-2"
            required
          />
          <SelectField
            label="Frecuencia"
            name="cadence"
            options={CADENCE_OPTIONS}
            defaultValue={initial?.cadence ?? 'daily'}
            error={errors.cadence}
          />
          <TextField
            label="Veces por periodo"
            name="targetPerPeriod"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={initial?.targetPerPeriod ?? '1'}
            error={errors.targetPerPeriod}
          />
        </>
      )}
    </FormShell>
  );
}

/** Borrador de la barra: «hecho: meditar». Dice claramente si el hábito se va a crear. */
export function HabitQuickForm({
  habitName,
  exists,
  onSaved,
  secondaryAction,
}: {
  habitName: string;
  exists: boolean;
  onSaved: (state: Saved) => void;
  secondaryAction?: ReactNode;
}) {
  return (
    <FormShell
      action={logHabitByName}
      submitLabel={exists ? 'Marcar como hecho' : 'Crear y marcar'}
      surface="paper"
      onSaved={onSaved}
      secondaryAction={secondaryAction}
      className="flex flex-col gap-4"
    >
      {(errors) => (
        <>
          <TextField
            label="Hábito"
            name="habitName"
            autoComplete="off"
            defaultValue={habitName}
            error={errors.habitName}
            required
          />
          <p className="text-small">
            {exists
              ? 'Se marcará como hecho hoy.'
              : 'Aún no tienes este hábito: se creará como diario y se marcará como hecho hoy.'}
          </p>
        </>
      )}
    </FormShell>
  );
}

type ActiveFocus = {
  id: string;
  label: string | null;
  started_at: string;
  planned_minutes: number;
  interruptions: number;
};

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function ServerButton({
  action,
  children,
  tone = 'secondary',
  pendingLabel,
}: {
  action: () => Promise<FormState>;
  children: ReactNode;
  tone?: 'primary' | 'secondary' | 'danger';
  pendingLabel: string;
}) {
  const [state, dispatch, pending] = useActionState(async () => action(), IDLE);
  return (
    <form action={dispatch} className="contents">
      <button type="submit" disabled={pending} className={buttonClass({ tone })}>
        {pending ? pendingLabel : children}
      </button>
      {state.status === 'error' ? <FormMessage state={state} /> : null}
    </form>
  );
}

/**
 * Foco (Pomodoro). El inicio vive en la base de datos: recargar o cambiar de pestaña no pierde la sesión.
 * La cuenta atrás es del cliente; al llegar a cero no se corta sola: se sigue contando el tiempo extra.
 */
export function FocusTimer({ active }: { active: ActiveFocus | null }) {
  const now = useNow(Boolean(active));

  if (!active) {
    return (
      <FormShell
        action={startFocus}
        submitLabel="Empezar foco"
        pendingLabel="Empezando…"
        className="grid grid-cols-2 gap-4 @lg:grid-cols-[1fr_10rem_auto] @lg:items-end"
      >
        {(errors) => (
          <>
            <TextField
              label="En qué (opcional)"
              name="label"
              autoComplete="off"
              placeholder="Informe trimestral"
              error={errors.label}
              className="col-span-2 @lg:col-span-1"
            />
            <TextField
              label="Minutos"
              name="plannedMinutes"
              inputMode="numeric"
              autoComplete="off"
              defaultValue="25"
              error={errors.plannedMinutes}
            />
          </>
        )}
      </FormShell>
    );
  }

  const elapsed = Math.max(0, Math.floor((now - new Date(active.started_at).getTime()) / 1000));
  const planned = active.planned_minutes * 60;
  const remaining = planned - elapsed;
  const overtime = remaining < 0;
  const shown = Math.abs(remaining);
  const clock = `${overtime ? '+' : ''}${Math.floor(shown / 60)}:${String(shown % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <p
          className={`font-display text-headline font-bold tabular-nums ${overtime ? 'text-brand-orange' : ''}`}
          aria-hidden="true"
        >
          {clock}
        </p>
        <p className="font-mono text-label text-ash uppercase">
          {active.label ?? 'Foco'} · {active.planned_minutes} min · {active.interruptions}{' '}
          {active.interruptions === 1 ? 'interrupción' : 'interrupciones'}
        </p>
      </div>
      <p className="sr-only" role="status">
        {overtime ? `Tiempo cumplido; llevas ${Math.floor(shown / 60)} minutos extra.` : ''}
      </p>
      <div className="flex flex-wrap gap-3">
        <ServerButton action={finishFocus.bind(null, active.id)} tone="primary" pendingLabel="Guardando…">
          Terminar y guardar
        </ServerButton>
        <ServerButton action={addInterruption.bind(null, active.id)} pendingLabel="Anotando…">
          + Interrupción
        </ServerButton>
        <ServerButton action={deleteFocusSession.bind(null, active.id)} tone="danger" pendingLabel="Descartando…">
          Descartar
        </ServerButton>
      </div>
    </div>
  );
}
