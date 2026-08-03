"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { sincronizarCuentas } from "@/app/admin/(panel)/contenido/actions";

/**
 * Trae de Post for Me las cuentas de Facebook/Instagram ya conectadas ahí. Es el
 * único camino para poblar `social_accounts`: no se escriben a mano.
 */
export function SincronizarCuentasButton({ variante = "secondary" }: { variante?: "secondary" | "primary" }) {
  const [pending, start] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function sync() {
    setMensaje(null);
    start(async () => {
      const res = await sincronizarCuentas();
      if ("error" in res) setMensaje({ tipo: "error", texto: res.error });
      else
        setMensaje({
          tipo: "ok",
          texto: res.count === 0 ? "Post for Me no tiene cuentas de Facebook ni Instagram conectadas." : `${res.count} cuenta(s) sincronizada(s).`,
        });
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        className={`crm-btn crm-btn-sm ${variante === "primary" ? "crm-btn-primary" : "crm-btn-secondary"}`}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <RefreshCw className="size-3.5" strokeWidth={2} />
        )}
        Sincronizar cuentas
      </button>
      {mensaje && (
        <p
          className="text-[12px] leading-snug"
          style={{ color: mensaje.tipo === "error" ? "var(--destructive)" : "var(--crm-ink-mute)" }}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
