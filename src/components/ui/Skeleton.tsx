// Carga: fichas esqueleto opacas, sin brillos animados (DESIGN_SYSTEM §5.8).

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`border-2 border-line bg-structure ${className}`} />;
}

export function SkeletonNumeral() {
  return (
    <div aria-hidden="true" className="col-span-full">
      <div className="h-[clamp(3.7rem,14vw,12.3rem)] w-3/4 bg-structure" />
      <div className="mt-3 h-4 w-48 bg-structure" />
    </div>
  );
}

/** Esqueleto de una lámina entera: cabecera, cifra y fichas en la rejilla. */
export function SheetSkeleton({ label }: { label: string }) {
  return (
    <>
      <p role="status" className="sr-only">
        Cargando {label}…
      </p>
      <div aria-hidden="true" className="col-span-full h-3 w-40 bg-structure" />
      <SkeletonNumeral />
      <SkeletonBlock className="col-span-full h-64 md:col-span-4 lg:col-span-6" />
      <SkeletonBlock className="col-span-full h-64 md:col-span-4 lg:col-span-6" />
      <SkeletonBlock className="col-span-full h-40 lg:col-span-12" />
    </>
  );
}
