// Iconos propios: trazo de 2 px, terminaciones rectas (como los bordes del sistema), en currentColor.
// Solo los que la interfaz usa; el resto de acciones se nombran con texto.

const PATHS = {
  'chevron-left': 'M10 3 5 8l5 5',
  'chevron-right': 'M6 3l5 5-5 5',
  'chevron-down': 'M3 6l5 5 5-5',
  check: 'M2.5 8.5 6.5 12.5 13.5 4.5',
  plus: 'M8 2.5v11M2.5 8h11',
  close: 'M3.5 3.5l9 9M12.5 3.5l-9 9',
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
