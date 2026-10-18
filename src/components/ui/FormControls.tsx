'use client';

import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormState } from '@/lib/action-result';
import { buttonClass } from './Button';

type Tone = 'primary' | 'secondary' | 'danger';
type Surface = 'folder' | 'paper';

/** Mientras la acción está en curso, el clic (o Intro en un campo) no la envía otra vez. */
const blockWhile = (pending: boolean) => (event: MouseEvent<HTMLButtonElement>) => {
  if (pending) event.preventDefault();
};

/**
 * Botón de envío que cambia de texto mientras la acción está en curso y no deja enviarla dos veces. No se
 * desactiva (aria-disabled, no disabled): un botón desactivado pierde el foco. Con useFormAction se le pasa
 * `pending`; con `<form action>`, lo lee de useFormStatus.
 */
export function SubmitButton({
  children,
  pending: pendingProp,
  pendingLabel = 'Guardando…',
  tone = 'primary',
  surface,
  className,
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  pending?: boolean;
  pendingLabel?: string;
  tone?: Tone;
  surface?: Surface;
  className?: string;
  /** Nombre con contexto cuando el mismo texto se repite en la lámina. Empieza por el texto visible. */
  'aria-label'?: string;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button
      type="submit"
      aria-disabled={pending}
      aria-label={pending ? undefined : ariaLabel}
      onClick={blockWhile(pending)}
      className={buttonClass({ tone, surface, className })}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Resultado de la última acción del formulario. Los errores interrumpen; los éxitos solo informan. */
export function FormMessage({ state, id, className = '' }: { state: FormState; id?: string; className?: string }) {
  // Cada resultado se vuelve a escribir aunque repita el texto («Gasto guardado.» dos veces): si el DOM no cambia,
  // el lector de pantalla no lo anuncia. La región sigue montada; lo que cambia es lo que hay dentro.
  const [shown, setShown] = useState({ state, count: 0 });
  if (shown.state !== state) setShown({ state, count: shown.count + 1 });

  if (state.status === 'idle') return <p id={id} role="status" className="sr-only" />;
  const isError = state.status === 'error';
  return (
    <p
      id={id}
      role={isError ? 'alert' : 'status'}
      className={`text-small ${isError ? 'form-error' : 'form-success'} ${className}`}
    >
      <span key={shown.count}>
        <span aria-hidden="true">{isError ? '▲ ' : '● '}</span>
        {state.message}
      </span>
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
  pendingLabel = 'Borrando…',
  context,
  surface,
  quiet,
}: {
  label?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  /** Qué se borra, para el nombre accesible cuando la etiqueta se repite en la lámina («Quitar serie 2 de…»). */
  context?: string;
  surface?: Surface;
  /** Primer paso discreto, para filas densas; la confirmación sigue siendo roja. */
  quiet?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  // Al cancelar, el foco vuelve al primer botón: el de confirmar, que lo tenía, desaparece.
  const restoreFocus = useRef(false);
  const named = (text: string) => (context ? `${text} ${context}` : undefined);

  if (!armed) {
    return (
      <button
        ref={(element) => {
          if (element && restoreFocus.current) {
            restoreFocus.current = false;
            element.focus();
          }
        }}
        type="button"
        aria-label={named(label)}
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
        aria-disabled={pending}
        aria-label={pending ? undefined : named(confirmLabel)}
        onClick={blockWhile(pending)}
        autoFocus
        className={buttonClass({ tone: 'danger', surface, className: 'bg-signal-down text-black' })}
      >
        {pending ? pendingLabel : confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => {
          restoreFocus.current = true;
          setArmed(false);
        }}
        className={buttonClass({ tone: 'secondary', surface })}
      >
        Cancelar
      </button>
    </span>
  );
}
