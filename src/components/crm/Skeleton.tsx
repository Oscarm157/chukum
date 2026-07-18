/**
 * Bloques de carga on-system del panel. Neutros (surface + pulse), sirven como
 * fallback de Suspense para cualquier ruta force-dynamic mientras resuelven sus
 * queries, en vez de pantalla en blanco.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--crm-r-md)] bg-[var(--crm-surface-3)] ${className}`} />;
}

/** Fallback genérico de página: header + tira de filas. */
export function PageSkeleton() {
  return (
    <div>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="mt-5 space-y-2 overflow-hidden rounded-[var(--crm-r-lg)] border border-[var(--crm-line)] p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}
