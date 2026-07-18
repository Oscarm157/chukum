"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Lee ?flash=<clave> de la URL (que ponen las acciones que navegan, p. ej.
 * createLead/deleteLead), emite el toast una sola vez y limpia el parámetro sin
 * recargar. Montado una vez en el layout del panel.
 */
const MESSAGES: Record<string, { type: "success" | "error"; text: string }> = {
  "lead-creado": { type: "success", text: "Lead creado." },
  "lead-eliminado": { type: "success", text: "Lead eliminado." },
};

export function FlashToaster() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const flash = params.get("flash");

  useEffect(() => {
    if (!flash) return;
    const msg = MESSAGES[flash];
    if (msg) toast[msg.type](msg.text);
    const next = new URLSearchParams(params);
    next.delete("flash");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  return null;
}
