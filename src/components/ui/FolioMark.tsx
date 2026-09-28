/**
 * La carpeta del logotipo (docs/brand/folio-logo.svg), sin su fondo: en currentColor, para ir junto a la
 * palabra FOLIO sobre la mesa naranja. Decorativa: el nombre ya lo dice el texto de al lado.
 */
export function FolioMark({ className = 'h-3 w-auto' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="327 390 624 453" className={className} fill="currentColor">
      <path d="M357 390H560L601 443.5H890V489.5H400L357 635Z" />
      <path d="M421 517H951L860 843H327Z" />
    </svg>
  );
}
