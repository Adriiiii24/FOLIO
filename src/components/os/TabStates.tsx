'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Error de una lámina (error.tsx de cada pestaña). Qué ha pasado y qué hacer, sin disculpas (§5.8).
 * La barra de sistema, las pestañas y la barra de entrada siguen funcionando: el fallo es de esta lámina.
 */
export function TabError({
  error,
  retry,
  label,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  label: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid grid-cols-4 gap-4 px-4 pt-6 md:grid-cols-8 md:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8">
      <section
        role="alert"
        className="col-span-full flex flex-col items-start gap-4 border-2 border-signal-down bg-structure p-4 lg:col-span-8 lg:p-5"
      >
        <h1 className="text-title font-semibold">No se ha podido cargar {label}.</h1>
        <p className="max-w-[65ch] text-body text-ash">
          Puede ser la conexión o un fallo momentáneo del servidor. Tus datos están a salvo. Vuelve a intentarlo; si
          sigue fallando, prueba en unos minutos.
        </p>
        {error.digest ? <p className="font-mono text-micro text-ash uppercase">Referencia: {error.digest}</p> : null}
        <Button tone="primary" onClick={() => retry()}>
          Reintentar
        </Button>
      </section>
    </div>
  );
}
