"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Check, Link2, ExternalLink, Trash2, Plus } from "lucide-react";
import { createFeedbackLink, toggleFeedbackLink, setNoteStatus, deleteNote } from "./actions";

type LinkRow = { id: string; label: string; token: string; active: boolean; createdAt: string | null };
type NoteRow = {
  id: string;
  linkId: string;
  linkLabel: string | null;
  path: string;
  note: string;
  selector: string | null;
  elementText: string | null;
  pageTitle: string | null;
  status: "open" | "resolved";
  createdAt: string | null;
};

function fmt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function shareUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/inicio?fb=${token}`;
}

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#e4dac9] px-2.5 py-1 text-[12px] text-[#6e6353] transition hover:bg-[#efe7d8]"
    >
      {done ? <Check className="size-3.5 text-[#2e7d6b]" /> : <Copy className="size-3.5" />}
      {done ? "Copiado" : label}
    </button>
  );
}

export function FeedbackBoard({
  links,
  notes,
  openCount,
}: {
  links: LinkRow[];
  notes: NoteRow[];
  openCount: number;
}) {
  const [pending, startTransition] = useTransition();

  // Notas agrupadas por página, manteniendo el orden (más reciente primero).
  const groups = useMemo(() => {
    const map = new Map<string, NoteRow[]>();
    for (const n of notes) {
      const arr = map.get(n.path) ?? [];
      arr.push(n);
      map.set(n.path, arr);
    }
    return Array.from(map.entries());
  }, [notes]);

  const exportText = useMemo(() => {
    const lines: string[] = ["# Comentarios del sitio — Chukum", ""];
    for (const [path, items] of groups) {
      const title = items[0]?.pageTitle;
      lines.push(`## ${path}${title ? ` — ${title}` : ""}`);
      items.forEach((n, i) => {
        const st = n.status === "resolved" ? "resuelto" : "abierto";
        lines.push(`${i + 1}. [${st}] ${n.note}`);
        if (n.elementText) lines.push(`   - ubicación: ${n.elementText}`);
        if (n.selector) lines.push(`   - selector: ${n.selector}`);
        lines.push(`   - ${fmt(n.createdAt)}`);
      });
      lines.push("");
    }
    return lines.join("\n");
  }, [groups]);

  return (
    <div className="space-y-10">
      {/* Enlaces */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-[#241e17]">Enlaces para revisar</h2>
          <span className="font-mono text-[11px] text-[#6e6353]">{links.filter((l) => l.active).length} activos</span>
        </div>

        <form
          action={(fd) => startTransition(() => void createFeedbackLink(fd))}
          className="mb-4 flex flex-wrap items-center gap-2"
        >
          <input
            name="label"
            required
            maxLength={120}
            placeholder="Nombre del enlace (ej. Oscar · ronda 1)"
            className="min-w-[260px] flex-1 rounded-lg border border-[#e4dac9] bg-[#fbf7ef] px-3 py-2 text-[13px] text-[#241e17] placeholder:text-[#6e6353] focus:border-[#2e7d6b] focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2e7d6b] px-3 py-2 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Crear enlace
          </button>
        </form>

        {links.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#e4dac9] px-4 py-6 text-center text-[13px] text-[#6e6353]">
            Aún no hay enlaces. Crea uno y ábrelo para comentar sobre el sitio en vivo.
          </p>
        ) : (
          <ul className="divide-y divide-[#e4dac9] rounded-xl border border-[#e4dac9]">
            {links.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Link2 className="size-4 shrink-0 text-[#6e6353]" />
                <div className="min-w-[180px] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#241e17]">{l.label}</span>
                    {!l.active && (
                      <span className="rounded-full bg-[#efe7d8] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#6e6353]">
                        revocado
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-[#6e6353]">{shareUrl(l.token)}</span>
                </div>
                <CopyBtn text={shareUrl(l.token)} label="Copiar enlace" />
                <button
                  type="button"
                  onClick={() => startTransition(() => void toggleFeedbackLink(l.id, !l.active))}
                  className="rounded-md border border-[#e4dac9] px-2.5 py-1 text-[12px] text-[#6e6353] transition hover:bg-[#efe7d8]"
                >
                  {l.active ? "Revocar" : "Reactivar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comentarios */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-[#241e17]">
            Comentarios <span className="font-mono text-[12px] text-[#6e6353]">· {openCount} abiertos</span>
          </h2>
          {notes.length > 0 && <CopyBtn text={exportText} label="Copiar todo" />}
        </div>

        {notes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#e4dac9] px-4 py-10 text-center text-[13px] text-[#6e6353]">
            Todavía no hay comentarios. En cuanto dejes notas en el sitio, aparecerán aquí ordenadas por página.
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map(([path, items]) => (
              <div key={path} className="rounded-xl border border-[#e4dac9]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4dac9] px-4 py-2.5">
                  <div className="min-w-0">
                    <span className="font-mono text-[12px] text-[#241e17]">{path}</span>
                    {items[0]?.pageTitle && (
                      <span className="ml-2 text-[12px] text-[#6e6353]">{items[0].pageTitle}</span>
                    )}
                  </div>
                  <a
                    href={path}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-[#6e6353] transition hover:text-[#2e7d6b]"
                  >
                    <ExternalLink className="size-3.5" /> Abrir página
                  </a>
                </div>
                <ul className="divide-y divide-[#e4dac9]">
                  {items.map((n) => (
                    <li key={n.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {n.elementText && (
                            <p className="mb-1 text-[12px] text-[#6e6353]">
                              sobre <span className="text-[#241e17]">“{n.elementText}”</span>
                            </p>
                          )}
                          <p className={`text-[14px] leading-snug ${n.status === "resolved" ? "text-[#6e6353] line-through" : "text-[#241e17]"}`}>
                            {n.note}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-[#6e6353]">
                            <span>{fmt(n.createdAt)}</span>
                            {n.linkLabel && <span>· {n.linkLabel}</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              startTransition(() => void setNoteStatus(n.id, n.status === "resolved" ? "open" : "resolved"))
                            }
                            className={`rounded-md border px-2 py-1 text-[12px] transition ${
                              n.status === "resolved"
                                ? "border-[#e4dac9] text-[#6e6353] hover:bg-[#efe7d8]"
                                : "border-[#2e7d6b] text-[#2e7d6b] hover:bg-[#efe7d8]"
                            }`}
                          >
                            {n.status === "resolved" ? "Reabrir" : "Resolver"}
                          </button>
                          <button
                            type="button"
                            onClick={() => startTransition(() => void deleteNote(n.id))}
                            className="rounded-md border border-[#e4dac9] p-1.5 text-[#6e6353] transition hover:text-red-500"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
