"use client";

import { useState } from "react";
import { Loader2, Check, Send } from "lucide-react";

type Props = {
  zonaSlug?: string;
  developmentSlug?: string;
  // Contexto para el mensaje por defecto del textarea.
  contextLabel?: string;
};

// Form de captura → POST /api/leads. Estados: idle / sending / sent / error.
export function ContactForm({ zonaSlug, developmentSlug, contextLabel }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const data = new FormData(e.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          message: String(data.get("message") ?? ""),
          locale: "es",
          source: "form",
          sourceUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
          zonaSlug,
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
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-hairline bg-surface p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracota/10 text-terracota">
          <Check className="h-5 w-5" />
        </span>
        <p className="font-display text-2xl tracking-[-0.02em]">Mensaje recibido</p>
        <p className="text-ink-2">
          Te contactamos con la disponibilidad y precios{contextLabel ? ` de ${contextLabel}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-hairline bg-surface p-6 md:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Nombre</span>
          <input
            name="name"
            required
            placeholder="Tu nombre"
            className="mt-1.5 w-full rounded-full border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-terracota focus:bg-surface"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Teléfono</span>
          <input
            name="phone"
            type="tel"
            placeholder="999 000 0000"
            className="mt-1.5 w-full rounded-full border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-terracota focus:bg-surface"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Correo</span>
        <input
          name="email"
          type="email"
          required
          placeholder="tu@correo.com"
          className="mt-1.5 w-full rounded-full border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-terracota focus:bg-surface"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Mensaje</span>
        <textarea
          name="message"
          rows={3}
          defaultValue={
            contextLabel ? `Quiero disponibilidad y precios de ${contextLabel}.` : ""
          }
          placeholder="¿Qué buscas? Terreno, casa, presupuesto aproximado."
          className="mt-1.5 w-full resize-none rounded-2xl border border-hairline bg-canvas px-4 py-3 text-sm outline-none transition focus:border-terracota focus:bg-surface"
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-canvas transition hover:bg-terracota-deep disabled:opacity-60"
      >
        {status === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {status === "sending" ? "Enviando" : "Solicitar informes"}
      </button>

      {status === "error" && (
        <p className="mt-3 text-center text-sm text-terracota">
          No se pudo enviar. Escríbenos por WhatsApp e intentamos de inmediato.
        </p>
      )}

      <p className="mt-3 text-center text-xs text-ink-2">
        Tus datos van directo al desarrollador. No compartimos tu información.
      </p>
    </form>
  );
}
