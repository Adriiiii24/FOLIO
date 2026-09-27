'use client';

import { useActionState } from 'react';
import { sendMagicLink, type MagicLinkState } from '@/modules/auth/actions';

const initialState: MagicLinkState = { status: 'idle' };

export function MagicLinkForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === 'sent') {
    return <p role="status">Enlace enviado a {state.email}. Puedes abrirlo en este dispositivo o en cualquier otro.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" required className="border-2 p-2" />
      <button type="submit" disabled={pending} className="border-2 p-2">
        {pending ? 'Enviando…' : 'Enviar enlace de acceso'}
      </button>
      {state.status === 'error' && <p role="alert">{state.message}</p>}
    </form>
  );
}
