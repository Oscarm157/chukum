"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Modal } from "@/components/crm/Modal";
import {
  listarCuentasDisponibles,
  conectarCuentas,
  type CuentaDisponible,
} from "@/app/admin/(panel)/contenido/actions";
import { PLATFORM_LABEL } from "@/components/crm/contenido/badges";

/**
 * La misma API key de Post for Me puede traer cuentas de OTROS negocios de Oscar, no
 * solo de Chukum (pasó: dos páginas de Facebook ajenas aparecieron en la lista). Por
 * eso esto es un picker de dos pasos, nunca un "traer todo": listar no escribe nada,
 * y solo se conectan las cuentas que Oscar marca a mano.
 */
export function SincronizarCuentasButton({ variante = "secondary" }: { variante?: "secondary" | "primary" }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [cuentas, setCuentas] = useState<CuentaDisponible[] | null>(null);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function abrir() {
    setOpen(true);
    setMensaje(null);
    setCuentas(null);
    start(async () => {
      const res = await listarCuentasDisponibles();
      if ("error" in res) {
        setMensaje({ tipo: "error", texto: res.error });
        return;
      }
      setCuentas(res.cuentas);
      setSeleccion(new Set(res.cuentas.filter((c) => c.yaConectada).map((c) => c.id)));
    });
  }

  function toggle(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function conectar() {
    start(async () => {
      const res = await conectarCuentas({ postForMeAccountIds: Array.from(seleccion) });
      if ("error" in res) {
        setMensaje({ tipo: "error", texto: res.error });
        return;
      }
      setOpen(false);
      setMensaje({
        tipo: "ok",
        texto: res.count === 0 ? "No quedó ninguna cuenta conectada." : `${res.count} cuenta(s) conectada(s).`,
      });
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={abrir}
        disabled={pending && open}
        className={`crm-btn crm-btn-sm ${variante === "primary" ? "crm-btn-primary" : "crm-btn-secondary"}`}
      >
        <RefreshCw className="size-3.5" strokeWidth={2} />
        Sincronizar cuentas
      </button>
      {mensaje && !open && (
        <p
          className="text-[12px] leading-snug"
          style={{ color: mensaje.tipo === "error" ? "var(--destructive)" : "var(--crm-ink-mute)" }}
        >
          {mensaje.texto}
        </p>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Elegir cuentas de Chukum" maxWidth={480}>
        <p className="mb-3 text-[12.5px] leading-relaxed text-[var(--crm-ink-mute)]">
          Post for Me puede traer cuentas de otros negocios conectados con la misma llave. Marca
          solo las que sean de Chukum: las demás no se guardan aquí.
        </p>

        {pending && !cuentas && (
          <div className="flex items-center gap-2 py-6 text-[13px] text-[var(--crm-ink-mute)]">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Consultando Post for Me…
          </div>
        )}

        {mensaje?.tipo === "error" && (
          <p className="py-2 text-[12.5px]" style={{ color: "var(--destructive)" }}>
            {mensaje.texto}
          </p>
        )}

        {cuentas && cuentas.length === 0 && (
          <p className="py-6 text-[13px] text-[var(--crm-ink-mute)]">
            Post for Me no tiene ninguna cuenta de Facebook ni Instagram conectada todavía.
          </p>
        )}

        {cuentas && cuentas.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {cuentas.map((c) => (
              <label
                key={c.id}
                className="crm-card flex cursor-pointer items-center gap-2.5 !p-2.5 text-[13px]"
              >
                <input
                  type="checkbox"
                  checked={seleccion.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="size-4"
                />
                <span className="crm-badge">{PLATFORM_LABEL[c.platform] ?? c.platform}</span>
                <span className="truncate text-[var(--crm-ink)]">{c.username ?? c.id}</span>
              </label>
            ))}
          </div>
        )}

        {cuentas && cuentas.length > 0 && (
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="crm-btn crm-btn-sm crm-btn-ghost">
              Cancelar
            </button>
            <button
              type="button"
              onClick={conectar}
              disabled={pending}
              className="crm-btn crm-btn-sm crm-btn-primary"
            >
              {pending && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />}
              Guardar selección
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
