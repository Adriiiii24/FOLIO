'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';
import type { FormState } from '@/lib/action-result';
import { cardHeading, editButtonId, keepFocus } from './focus';
import { FormMessage, SubmitButton } from './FormControls';
import { useFormAction } from './useFormAction';

export type Saved = Extract<FormState, { status: 'success' }>;

export type FormShellProps = {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  children: (errors: Record<string, string>) => ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  surface?: 'folder' | 'paper';
  /** Vaciar el formulario al guardar (alta). En edición y en borradores no. */
  resetOnSuccess?: boolean;
  /** Tras guardar, volver aquí (p. ej. la lámina sin `?edit`). */
  doneHref?: string;
  onSaved?: (state: Saved) => void;
  secondaryAction?: ReactNode;
  className?: string;
  submitTone?: 'primary' | 'secondary' | 'danger';
  /** Metadato de un borrador de IA (JSON de AiMetaInput): viaja en el campo oculto `ai`. */
  aiMeta?: string;
};

/** Formulario de módulo: validación en servidor, errores por campo, envío con estado y resultado anunciado. */
export function FormShell({
  action,
  children,
  submitLabel,
  pendingLabel,
  surface = 'folder',
  resetOnSuccess,
  doneHref,
  onSaved,
  secondaryAction,
  className,
  submitTone,
  aiMeta,
}: FormShellProps) {
  const router = useRouter();
  const { state, pending, errors, formProps } = useFormAction(action, {
    reset: resetOnSuccess,
    onSuccess: (result) => {
      onSaved?.(result);
      if (doneHref) router.replace(doneHref, { scroll: false });
    },
  });

  // Si el formulario desaparece al guardar, el foco no se pierde: en una edición vuelve al «Editar» de su fila
  // (el id viaja en el campo oculto); si no (empezar una sesión o un foco), va al título de su ficha.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const id = doneHref ? new FormData(form).get('id') : null;
    keepFocus(form, [typeof id === 'string' && id ? editButtonId(id) : null, cardHeading(form)]);
    formProps.onSubmit(event);
  }

  return (
    <form {...formProps} onSubmit={onSubmit} className={className ?? 'grid grid-cols-1 gap-4 @md:grid-cols-2'}>
      {aiMeta ? <input type="hidden" name="ai" value={aiMeta} /> : null}
      {children(errors)}
      {/* col-span-full: en las rejillas de 2 o 4 columnas, la fila de acciones ocupa siempre todo el ancho.
          data-form-actions: dentro de un borrador, esta fila se queda fija al pie (globals.css, .draft-sheet). */}
      <div data-form-actions className="col-span-full flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending} pendingLabel={pendingLabel} surface={surface} tone={submitTone}>
          {submitLabel}
        </SubmitButton>
        {secondaryAction}
        <FormMessage state={state} />
      </div>
    </form>
  );
}
