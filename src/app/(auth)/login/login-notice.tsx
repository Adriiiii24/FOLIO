'use client';

import { useRef } from 'react';
import { useFocusOnMount } from '@/components/ui/useFocusOnMount';

/**
 * Aviso con el que se llega al acceso (un enlace caducado, un fallo de Google, la cuenta borrada). Una alerta que
 * ya viene en el HTML del servidor no se anuncia de forma fiable al cargar: el aviso recibe el foco, y el siguiente
 * Tab lleva al campo del email.
 */
export function LoginNotice({ id, tone, children }: { id: string; tone: 'error' | 'info'; children: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useFocusOnMount(ref);
  return (
    <p
      ref={ref}
      id={id}
      tabIndex={-1}
      role={tone === 'error' ? 'alert' : 'status'}
      className="border-2 border-black px-3 py-2 text-small font-semibold"
    >
      {children}
    </p>
  );
}
