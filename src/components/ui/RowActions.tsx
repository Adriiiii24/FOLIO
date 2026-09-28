'use client';

import { useActionState } from 'react';
import { IDLE, type FormState } from '@/lib/action-result';
import { buttonClass } from './Button';
import { ConfirmSubmit, FormMessage } from './FormControls';

/** Borrado en el sitio con confirmación en dos pasos; el error, si lo hay, se anuncia junto al botón. */
export function DeleteForm({
  action,
  label = 'Borrar',
  confirmLabel,
  quiet,
}: {
  action: () => Promise<FormState>;
  label?: string;
  confirmLabel?: string;
  quiet?: boolean;
}) {
  const [state, dispatch] = useActionState(async () => action(), IDLE);
  return (
    <form action={dispatch} className="flex flex-wrap items-center gap-3">
      <ConfirmSubmit label={label} confirmLabel={confirmLabel} quiet={quiet} />
      {state.status === 'error' ? <FormMessage state={state} /> : null}
    </form>
  );
}

/** Escribe un ejemplo en la barra de entrada y le da el foco: los estados vacíos enseñan la entrada. */
export function PrefillButton({ text, label = 'Probar' }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('folio:prefill', { detail: text }))}
      className={buttonClass({ tone: 'secondary', className: 'normal-case' })}
    >
      <span className="uppercase">{label}</span>
      <span className="font-sans text-small tracking-normal">«{text}»</span>
    </button>
  );
}
