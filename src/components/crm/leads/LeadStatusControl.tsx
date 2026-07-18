"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateLeadStatus } from "@/app/admin/(panel)/leads/actions";

const STATUSES = [
  ["nuevo", "Nuevo"],
  ["contactado", "Contactado"],
  ["enviado_crm", "Enviado a CRM"],
  ["cerrado", "Cerrado"],
] as const;

export function LeadStatusControl({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();

  return (
    <span className="inline-flex items-center gap-2">
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          start(() => updateLeadStatus(id, next));
        }}
        className="crm-select"
        style={{ width: "auto" }}
        aria-label="Cambiar estatus del lead"
      >
        {STATUSES.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
      </select>
      {pending && <Loader2 className="size-3.5 animate-spin text-[var(--crm-ink-mute)]" strokeWidth={2} />}
    </span>
  );
}
