'use client';

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from 'react';
import { IDLE, type FormState } from '@/lib/action-result';

type Action = (previous: FormState, formData: FormData) => Promise<FormState>;
type Success = Extract<FormState, { status: 'success' }>;

/**
 * Conecta un formulario con una Server Action sin el reinicio automático de React 19: con `<form action>`,
 * React vacía los campos al acabar la acción aunque haya devuelto un error de validación, y se pierde lo
 * escrito. Aquí el formulario solo se vacía si la acción sale bien, y si falla el foco va al primer campo
 * inválido.
 */
export function useFormAction(action: Action, options: { reset?: boolean; onSuccess?: (state: Success) => void } = {}) {
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const optionsRef = useRef(options);
  const handled = useRef<FormState>(IDLE);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state.status === 'success') {
      if (optionsRef.current.reset) formRef.current?.reset();
      optionsRef.current.onSuccess?.(state);
    } else if (state.status === 'error') {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {};
  return { state, pending, errors, formProps: { ref: formRef, onSubmit, noValidate: true } };
}
