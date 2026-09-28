'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 700;
// Salida exponencial: la cifra llega rápido y se asienta despacio, como el muelle de la lámina.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * La cifra protagonista rueda hasta su nuevo valor cuando cambia con la lámina abierta (al guardar un
 * borrador, la página se revalida y el gasto del mes sube). Al montar no se anima: al entrar en una
 * pestaña la cifra ya está ahí. Con movimiento reducido, salta al valor final.
 */
export function RollingNumber({ value, format }: { value: number; format?: Intl.NumberFormatOptions }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  // Lo que se ve ahora mismo: si el valor cambia a media rueda, sigue desde ahí y no salta.
  const live = useRef(value);

  useEffect(() => {
    const start = live.current;
    if (start === value) return;
    const show = (next: number) => {
      live.current = next;
      setShown(next);
    };
    if (reduce) {
      const frame = requestAnimationFrame(() => show(value));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    const began = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - began) / DURATION_MS);
      show(t === 1 ? value : start + (value - start) * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);

  return new Intl.NumberFormat('es-ES', format).format(shown);
}
