import type { SocialPostStatus } from "@/lib/schema";

export const STATUS_LABEL: Record<SocialPostStatus, string> = {
  borrador: "Borrador",
  programado: "Programado",
  publicado: "Publicado",
  error: "Error",
};

// Un post solo se puede editar mientras no haya salido a Post for Me.
export const EDITABLE: SocialPostStatus[] = ["borrador", "error"];

const STATUS_CLASS: Record<SocialPostStatus, string> = {
  borrador: "",
  programado: "crm-badge-amber",
  publicado: "crm-badge-emerald",
  error: "",
};

// Rojo del sistema (--destructive) con tinte propio: no hay crm-badge-red en globals
// y no se agrega un token nuevo por un solo caso.
const ERROR_STYLE = {
  background: "rgb(240 80 63 / 0.12)",
  color: "var(--destructive)",
  borderColor: "rgb(240 80 63 / 0.3)",
};

export function EstadoBadge({ status }: { status: SocialPostStatus }) {
  return (
    <span
      className={`crm-badge ${STATUS_CLASS[status]}`}
      style={status === "error" ? ERROR_STYLE : undefined}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const PLATFORM_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
};

export function PlataformaBadges({ platforms }: { platforms: string[] }) {
  if (!platforms.length) {
    return <span className="text-[12.5px] text-[var(--crm-ink-faint)]">Sin elegir</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {platforms.map((p) => (
        <span key={p} className="crm-badge">
          {PLATFORM_LABEL[p] ?? p}
        </span>
      ))}
    </span>
  );
}

// Yucatán no cambia de horario: fijar la zona evita que el servidor (UTC en Vercel)
// muestre una hora de publicación distinta a la que Oscar programó.
const fecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Merida",
});

export function fmtFecha(d: Date | string | null): string {
  return d ? fecha.format(new Date(d)) : "—";
}
