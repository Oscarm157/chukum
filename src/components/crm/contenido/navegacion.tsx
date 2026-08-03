import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

/**
 * Ruta y salto entre borradores del módulo de contenido. Reemplaza el "← Redes sociales"
 * suelto que estaba duplicado en la pantalla de alta y en el detalle.
 */

export function ContenidoBreadcrumb({ actual }: { actual: string }) {
  return (
    <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1 text-[12.5px]">
      <Link
        href="/admin/contenido"
        className="text-[var(--crm-ink-mute)] transition-colors hover:text-[var(--crm-ink)]"
      >
        Redes sociales
      </Link>
      <ChevronRight className="size-3.5 shrink-0 text-[var(--crm-ink-faint)]" strokeWidth={2} aria-hidden />
      <span className="truncate text-[var(--crm-ink-soft)]">{actual}</span>
    </nav>
  );
}

/** Salta al borrador de antes o de después sin volver a la lista. */
export function PostVecinos({ anterior, siguiente }: { anterior: string | null; siguiente: string | null }) {
  return (
    <div className="flex items-center gap-1">
      <Flecha id={anterior} dir="anterior" />
      <Flecha id={siguiente} dir="siguiente" />
    </div>
  );
}

function Flecha({ id, dir }: { id: string | null; dir: "anterior" | "siguiente" }) {
  const Icono = dir === "anterior" ? ChevronLeft : ChevronRight;
  const etiqueta = dir === "anterior" ? "Post anterior" : "Post siguiente";
  const contenido = <Icono className="size-4" strokeWidth={2} />;

  // Sin vecino la flecha se queda en su sitio, deshabilitada: la posición de los controles
  // no se mueve entre el primer post y el resto.
  if (!id) {
    return (
      <span aria-label={`${etiqueta} (no hay)`} aria-disabled className="crm-btn crm-btn-sm crm-btn-ghost !px-1.5 opacity-40">
        {contenido}
      </span>
    );
  }
  return (
    <Link href={`/admin/contenido/${id}`} aria-label={etiqueta} title={etiqueta} className="crm-btn crm-btn-sm crm-btn-ghost !px-1.5">
      {contenido}
    </Link>
  );
}
