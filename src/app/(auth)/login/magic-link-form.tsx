'use client';

import { useActionState } from 'react';
import { TextField } from '@/components/ui/Field';
import { FormMessage, SubmitButton } from '@/components/ui/FormControls';
import { sendMagicLink, type MagicLinkState } from '@/modules/auth/actions';

const initialState: MagicLinkState = { status: 'idle' };

export function MagicLinkForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === 'sent') {
    return (
      <div role="status" className="flex flex-col gap-2">
        <p className="text-title font-semibold">Revisa tu correo.</p>
        <p className="text-body">
          Te hemos enviado un enlace a <strong className="font-semibold">{state.email}</strong>. Ábrelo en este
          dispositivo o en cualquier otro; caduca en una hora.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="tu@correo.com"
        required
        error={state.status === 'error' ? state.message : undefined}
      />
      <SubmitButton pending={pending} pendingLabel="Enviando…" surface="paper" className="w-full">
        Enviar enlace de acceso
      </SubmitButton>
      {state.status === 'error' ? (
        <FormMessage state={{ status: 'error', message: state.message }} className="sr-only" />
      ) : null}
    </form>
  );
}
