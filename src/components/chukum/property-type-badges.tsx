import type { ComponentType } from "react";
import { Trees, Home, Building2, Store } from "lucide-react";
import { PROPERTY_TYPE_LABEL, type PropertyType } from "@/lib/property-types";
import { cn } from "@/lib/utils";

// Un ícono por tipo en vez de color: el sistema de diseño de cada scope (.chukum, .vivir)
// define un único acento de marca, así que la distinción entre terreno/casa/depa no puede
// vivir en el color sin romper esa regla. El ícono + label sí escala sin pisar el acento.
const ICON: Record<PropertyType, ComponentType<{ className?: string }>> = {
  terreno: Trees,
  casa: Home,
  departamento: Building2,
  townhouse: Building2,
  local_comercial: Store,
};

export function PropertyTypeBadges({
  tipos,
  className,
}: {
  tipos?: PropertyType[] | null;
  className?: string;
}) {
  if (!tipos || tipos.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tipos.map((t) => {
        const Icon = ICON[t];
        return (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas/80 px-2.5 py-1 text-xs font-medium text-ink"
          >
            <Icon className="h-3.5 w-3.5" />
            {PROPERTY_TYPE_LABEL[t]}
          </span>
        );
      })}
    </div>
  );
}
