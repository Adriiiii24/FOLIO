// Iconos propios: trazo de 2 px, terminaciones rectas (como los bordes del sistema), en currentColor.
// Solo los que la interfaz usa; el resto de acciones se nombran con texto.

const PATHS = {
  'chevron-left': 'M10 3 5 8l5 5',
  'chevron-right': 'M6 3l5 5-5 5',
  'chevron-down': 'M3 6l5 5 5-5',
  check: 'M2.5 8.5 6.5 12.5 13.5 4.5',
  plus: 'M8 2.5v11M2.5 8h11',
  close: 'M3.5 3.5l9 9M12.5 3.5l-9 9',
  // Pestañas de la barra de entrada (§5.6): lápiz, bocadillo, cámara y micrófono, con la misma geometría recta.
  pencil: 'M2.5 13.5l1-4 7.5-7.5 3 3-7.5 7.5zM9.5 3.5l3 3',
  ask: 'M1.5 2.5h13v8.5h-7l-3.5 3v-3h-2.5z',
  camera: 'M1.5 5h3l1.5-2h4l1.5 2h3v8.5h-13zM8 7.25a2.25 2.25 0 1 0 0 4.5a2.25 2.25 0 1 0 0-4.5',
  mic: 'M6 1.5h4v7h-4zM3.5 7v1.5a4.5 4.5 0 0 0 9 0V7M8 13v2',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = 'size-4' }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
