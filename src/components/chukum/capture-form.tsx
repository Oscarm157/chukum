"use client";

import { useState } from "react";
import { Loader2, Check, ArrowRight } from "lucide-react";

type Props = {
  // Etiqueta de contexto para el mensaje y el copy de éxito (ej. nombre del desarrollo).
  context?: string;
  developmentSlug?: string;
  // Texto extra que se antepone al mensaje (ej. resumen de respuestas del quiz).
  prefillMessage?: string;
  cta?: string;
};

// Captura → POST /api/leads (el endpoint ya existe: Zod + rate-limit + dedupe + Resend).
// Estilada con tokens .chukum (acento cenote). Estados: idle / sending / sent / error.
export function CaptureForm({ context, developmentSlug, prefillMessage, cta = "Solicitar disponibilidad y precios" }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const data = new FormData(e.currentTarget);
    const message = [prefillMessage, String(data.get("message") ?? "")]
      .filter(Boolean)
      .join(" · ");
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          phone: String(data.get("phone") ?? ""),
          email: String(data.get("email") ?? ""),
          message,
          locale: "es",
          source: "form",
          sourceUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
          developmentSlug,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-3xl border border-hairline bg-surface p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cenote/12 text-cenote">
          <Check className="h-5 w-5" />
        </span>
        <p className="font-display text-2xl tracking-[-0.02em]">Listo, recibimos tus datos</p>
        <p className="text-ink-2">
          Te contactamos con la disponibilidad y precios{context ? ` de ${context}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-hairline bg-surface p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Nombre</span>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Tu nombre…"
            className="mt-1.5 w-full rounded-2xl border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-cenote"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-2">WhatsApp</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="999 000 0000…"
            className="mt-1.5 w-full rounded-2xl border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-cenote"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Correo (opcional)</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="tu@correo.com…"
          className="mt-1.5 w-full rounded-2xl border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-cenote"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Mensaje (opcional)</span>
        <textarea
          name="message"
          rows={2}
          placeholder="Presupuesto aproximado, dudas…"
          className="mt-1.5 w-full resize-none rounded-2xl border border-hairline bg-canvas px-4 py-3 text-sm outline-none transition focus:border-cenote"
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cenote px-6 py-3.5 text-sm font-medium text-canvas transition hover:bg-cenote-deep disabled:opacity-60"
      >
        {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {status === "sending" ? "Enviando…" : cta}
      </button>

      {status === "error" && (
        <p className="mt-3 text-center text-sm text-cenote-deep">
          No se pudo enviar. Escríbenos por WhatsApp e intentamos de inmediato.
        </p>
      )}

      <p className="mt-3 text-center text-xs text-ink-2">
        Tus datos van directo al desarrollador. No compartimos tu información.
      </p>
    </form>
  );
}
