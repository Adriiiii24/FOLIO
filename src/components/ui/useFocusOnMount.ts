'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Al montarse, el elemento recibe el foco si no lo tiene nadie: lo que se pulsó para abrirlo ya no existe (el
 * «Editar» de la fila) o la página acaba de cargar con un aviso. Nunca se lo quita a otro elemento.
 */
export function useFocusOnMount(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body) ref.current?.focus();
  }, [ref]);
}
