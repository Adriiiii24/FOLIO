'use client';

import { useActionState } from 'react';
import { IDLE, type FormState } from '@/lib/action-result';
import { ButtonLink, buttonClass } from './Button';
import { cardHeading, editButtonId, keepFocus, rowTargets } from './focus';
import { ConfirmSubmit, FormMessage } from './FormControls';

/**
 * Borrado en el sitio con confirmación en dos pasos; el error, si lo hay, se anuncia junto al botón. Si la fila
 * desaparece, el foco pasa a la siguiente, a la anterior o al título de la ficha.
 */
export function DeleteForm({
  action,
  label = 'Borrar',
  confirmLabel,
  pendingLabel,
  context,
  quiet,
}: {
  action: () => Promise<FormState>;
  label?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  /** Qué se borra, si la etiqueta se repite en la lámina: «Borrar» + «plato Lentejas». */
  context?: string;
  quiet?: boolean;
}) {
  const [state, dispatch] = useActionState(async () => action(), IDLE);
  return (
    <form
      action={dispatch}
      onSubmit={(event) => keepFocus(event.currentTarget, rowTargets(event.currentTarget))}
      className="flex flex-wrap items-center gap-3"
    >
      <ConfirmSubmit
        label={label}
        confirmLabel={confirmLabel}
        pendingLabel={pendingLabel}
        context={context}
        quiet={quiet}
      />
      {state.status === 'error' ? <FormMessage state={state} /> : null}
    </form>
  );
}

/** «Cancelar» de una fila en edición: vuelve a la lámina sin `?edit` y el foco, al «Editar» de esa fila. */
export function CancelEditLink({ href, rowId }: { href: string; rowId: string }) {
  return (
    <ButtonLink
      href={href}
      scroll={false}
      tone="quiet"
      onClick={(event) => keepFocus(event.currentTarget, [editButtonId(rowId), cardHeading(event.currentTarget)])}
    >
      Cancelar
    </ButtonLink>
  );
}

/** Escribe un ejemplo en la barra de entrada y le da el foco: los estados vacíos enseñan la entrada. */
export function PrefillButton({ text, label = 'Probar' }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      // Abre la ficha: la barra no debe tomar este clic por un «pulsar fuera» y cerrarse antes.
      data-quick-keep
      onClick={() => window.dispatchEvent(new CustomEvent('folio:prefill', { detail: text }))}
      className={buttonClass({ tone: 'secondary', className: 'normal-case' })}
    >
      <span className="uppercase">{label}</span>
      <span className="font-sans text-small tracking-normal">«{text}»</span>
    </button>
  );
}
