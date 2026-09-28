'use client';

import { useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormState } from '@/lib/action-result';
import { buttonClass } from './Button';

type Tone = 'primary' | 'secondary' | 'danger';
type Surface = 'folder' | 'paper';

/**
 * Botón de envío que se desactiva y cambia de texto mientras la acción está en curso. Con useFormAction
 * se le pasa `pending`; con `<form action>`, lo lee de useFormStatus.
 */
export function SubmitButton({
  children,
  pending: pendingProp,
  pendingLabel = 'Guardando…',
  tone = 'primary',
  surface,
  className,
}: {
  children: ReactNode;
  pending?: boolean;
  pendingLabel?: string;
  tone?: Tone;
  surface?: Surface;
  className?: string;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={buttonClass({ tone, surface, className })}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Resultado de la última acción del formulario. Los errores interrumpen; los éxitos solo informan. */
export function FormMessage({ state, className = '' }: { state: FormState; className?: string }) {
  if (state.status === 'idle') return <p role="status" className="sr-only" />;
  const isError = state.status === 'error';
  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={`text-small ${isError ? 'text-signal-down' : 'text-signal-up'} ${className}`}
    >
      <span aria-hidden="true">{isError ? '▲ ' : '● '}</span>
      {state.message}
    </p>
  );
}

/**
 * Borrado en dos pasos, en el sitio y sin modal: el primer toque pide confirmación, el segundo
 * envía el formulario que lo contiene. Nunca se borra con un solo toque por accidente.
 */
export function ConfirmSubmit({
  label = 'Borrar',
  confirmLabel = 'Sí, borrar',
  surface,
  quiet,
}: {
  label?: string;
  confirmLabel?: string;
  surface?: Surface;
  /** Primer paso discreto, para filas densas; la confirmación sigue siendo roja. */
  quiet?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className={buttonClass({ tone: quiet ? 'quiet' : 'danger', surface })}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex gap-2">
      <button
        type="submit"
        disabled={pending}
        autoFocus
        className={buttonClass({ tone: 'danger', surface, className: 'bg-signal-down text-black' })}
      >
        {pending ? 'Borrando…' : confirmLabel}
      </button>
      <button type="button" onClick={() => setArmed(false)} className={buttonClass({ tone: 'secondary', surface })}>
        Cancelar
      </button>
    </span>
  );
}
