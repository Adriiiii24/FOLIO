'use client';

import { useRef, type ReactNode } from 'react';
import { useFocusOnMount } from './useFocusOnMount';

/**
 * Encabezado de una fila abierta para editar: el registro no pierde su identidad al convertirse en formulario.
 * Recibe el foco al abrirse, porque el «Editar» pulsado desaparece con la fila.
 */
export function EditHeading({ children, className = 'mb-4' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useFocusOnMount(ref);
  return (
    <p ref={ref} tabIndex={-1} className={`font-mono text-label text-ash uppercase ${className}`}>
      Editando <span aria-hidden="true">·</span> <span className="text-white normal-case">{children}</span>
    </p>
  );
}
