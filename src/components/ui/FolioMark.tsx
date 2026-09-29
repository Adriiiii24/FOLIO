/**
 * La carpeta del logotipo (docs/brand/folio-logo.svg), sin su fondo: en currentColor, para ir junto a la
 * palabra FOLIO sobre la mesa naranja. Decorativa: el nombre ya lo dice el texto de al lado.
 */
export function FolioMark({ className = 'h-3 w-auto' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="340 422 575 373" className={className} fill="currentColor">
      <path d="M374 422H565L607 463H873L837 506H453L374 625Z" />
      <path d="M467 538H915L788 795H340Z" />
    </svg>
  );
}
