'use client';

import { useRef, useState } from 'react';
import { TextField } from '@/components/ui/Field';
import { FormMessage, SubmitButton } from '@/components/ui/FormControls';
import { useFormAction } from '@/components/ui/useFormAction';
import { sendMagicLink } from '@/modules/auth/actions';

/**
 * Acceso con enlace mágico. useFormAction no vacía el campo si el envío falla (con `<form action>`, React lo
 * vaciaría y habría que reescribir el email) y lleva el foco al campo con error. `describedBy`: el aviso de la
 * página («El enlace no es válido…») también describe el campo.
 */
export function MagicLinkForm({ next, describedBy }: { next: string; describedBy?: string }) {
  // Controlado: el aviso de enviado repite la dirección a la que ha ido el enlace.
  const [email, setEmail] = useState('');
  const sentRef = useRef<HTMLDivElement>(null);
  const { state, pending, errors, formProps } = useFormAction(sendMagicLink, {
    // El formulario desaparece al enviarse, con el foco dentro: pasa al aviso que lo sustituye en el mismo sitio.
    onSuccess: () => sentRef.current?.focus(),
  });
  const sent = state.status === 'success';

  return (
    <div>
      {/* Siempre montada: un lector de pantalla solo anuncia lo que cambia dentro de una región que ya existía. */}
      <div role="status">
        {sent ? (
          <div ref={sentRef} tabIndex={-1} className="flex flex-col gap-2">
            <p className="text-title font-semibold">Revisa tu correo.</p>
            <p className="text-body">
              Te hemos enviado un enlace a <strong className="font-semibold">{email.trim()}</strong>. Ábrelo en este
              dispositivo o en cualquier otro; caduca en una hora.
            </p>
          </div>
        ) : null}
      </div>
      {sent ? null : (
        <form {...formProps} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={state.status === 'error' ? (errors.email ?? state.message) : undefined}
            describedBy={describedBy}
            required
          />
          <SubmitButton pending={pending} pendingLabel="Enviando…" surface="paper" className="w-full">
            Enviar enlace de acceso
          </SubmitButton>
          {/* El error ya se ve bajo el campo; esta alerta lo repite para el lector de pantalla aunque el foco ya
              esté en el campo (enviar con Intro dos veces seguidas). */}
          <FormMessage state={state} className="sr-only" />
        </form>
      )}
    </div>
  );
}
