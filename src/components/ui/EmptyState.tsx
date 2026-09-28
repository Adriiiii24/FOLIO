import type { ReactNode } from 'react';

/** Vacío: enseña la entrada, no se disculpa (DESIGN_SYSTEM §5.8). */
export function EmptyState({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 border-t-2 border-line py-6">
      <p className="max-w-[65ch] text-body text-ash">{children}</p>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
