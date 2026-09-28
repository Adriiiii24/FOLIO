import type { ReactNode } from 'react';

/** Encabezado de una fila abierta para editar: el registro no pierde su identidad al convertirse en formulario. */
export function EditHeading({ children, className = 'mb-4' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-label text-ash uppercase ${className}`}>
      Editando <span aria-hidden="true">·</span> <span className="text-white normal-case">{children}</span>
    </p>
  );
}
