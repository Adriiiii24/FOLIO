import type { Transition } from 'motion/react';

/** Spring del brief. ζ ≈ 0,87 → sobreoscilación 0,43 %, asentamiento (2 %) 0,31 s. */
export const springSheet = { type: 'spring', stiffness: 300, damping: 30, mass: 1 } as const satisfies Transition;

/** Retroalimentación pequeña. ζ ≈ 0,94, asentamiento 0,16 s. */
export const springSnap = { type: 'spring', stiffness: 700, damping: 50, mass: 1 } as const satisfies Transition;

/** Pestañas de la barra de entrada: suben al pasar por encima. ζ ≈ 0,85, sobreoscilación ≈ 0,6 %, 0,22 s. */
export const springTab = { type: 'spring', stiffness: 500, damping: 38, mass: 1 } as const satisfies Transition;

export const easeOutStrong = [0.23, 1, 0.32, 1] as const;

/** Las salidas siempre más rápidas que las entradas. */
export const exitFast = { duration: 0.12, ease: easeOutStrong } as const satisfies Transition;

export const STAGGER_S = 0.04;
