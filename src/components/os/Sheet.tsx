import { ViewTransition, type ReactNode } from 'react';

export function Sheet({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'sheet-in-from-right', 'nav-back': 'sheet-in-from-left', default: 'none' }}
      exit={{ 'nav-forward': 'sheet-out-to-left', 'nav-back': 'sheet-out-to-right', default: 'none' }}
      default="none"
    >
      {/* items-start: cada ficha con su altura. Estiradas hasta la más alta de su fila dejaban huecos negros de
          cientos de píxeles junto a las listas largas. */}
      <div className="grid grid-cols-4 items-start gap-4 px-4 pt-6 md:grid-cols-8 md:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8">
        {children}
      </div>
    </ViewTransition>
  );
}
