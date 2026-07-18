"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[panel] error", error);
  }, [error]);

  return (
    <div className="crm-empty px-6 py-16">
      <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--crm-surface-3)]">
        <AlertTriangle className="size-5 text-[var(--destructive)]" strokeWidth={1.6} />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-[var(--crm-ink)]">Algo salió mal</p>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-[var(--crm-ink-soft)]">
        No se pudo cargar esta vista. Reintenta; si sigue fallando, avísanos.
      </p>
      <button type="button" onClick={reset} className="crm-btn crm-btn-secondary crm-btn-sm mt-4">
        <RotateCw className="size-3.5" strokeWidth={2} />
        Reintentar
      </button>
    </div>
  );
}
