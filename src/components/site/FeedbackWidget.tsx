"use client";

/* Sincroniza estado en efectos de montaje/ruta a propósito (soporte de micrófono, token
   de la URL, medición del documento). La regla no aplica a estos casos intencionales. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Send, Check, Mic, Square, Loader2 } from "lucide-react";

type Pin = {
  id: string;
  note: string;
  xPct: number | null;
  yPct: number | null;
  status: "open" | "resolved";
};

type Rect = { top: number; left: number; width: number; height: number };

type Draft = {
  screen: { left: number; top: number };
  doc: { xPct: number; yPct: number };
  // Nivel elemento (lo que se clicó exacto)
  elementSelector: string | null;
  elementStore: string | null; // se guarda (con nombre de archivo, para Oscar)
  elementShow: string | null; // se muestra al cliente (sin nombres internos)
  // Nivel sección (bloque completo que lo contiene)
  sectionSelector: string | null;
  sectionStore: string | null;
  sectionRect: Rect | null;
};

const TOKEN_KEY = "chukum_fb_token";

// CSS path corto y best-effort del elemento clicado (id si lo hay, si no tag + nth-of-type).
function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  let depth = 0;
  while (node && node.nodeType === 1 && depth < 4) {
    if (node.id) {
      parts.unshift(`#${node.id}`);
      break;
    }
    let part = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (parent) {
      const sibs = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
      if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = node.parentElement;
    depth++;
  }
  return parts.join(" > ").slice(0, 500);
}

// Nombre legible del archivo de imagen (decodifica el wrapper /_next/image de Next).
function imageName(src: string): string {
  let s = src;
  try {
    if (s.includes("/_next/image")) {
      const u = new URL(s, window.location.origin);
      s = u.searchParams.get("url") || s;
    }
  } catch {}
  return decodeURIComponent(s).split("?")[0].split("/").pop() || s;
}

// Describe el elemento clicado. `store` se guarda para Oscar (incluye nombre de
// archivo de imagen); `show` es lo que ve el cliente (sin nombres internos raros).
function describeElement(el: Element): { store: string | null; show: string | null } {
  const img = (el.tagName === "IMG" ? el : el.querySelector("img")) as HTMLImageElement | null;
  if (img) {
    const name = imageName(img.currentSrc || img.src || "");
    const alt = (img.alt || "").trim();
    return {
      store: `imagen: ${name}${alt ? ` (${alt})` : ""}`.slice(0, 200),
      show: alt ? `Imagen: ${alt}` : "Imagen",
    };
  }
  // Imagen de fondo (CSS) en el elemento o un par de ancestros.
  let node: Element | null = el;
  for (let i = 0; node && i < 3; i++, node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundImage;
    const m = bg && bg !== "none" ? bg.match(/url\(["']?([^"')]+)["']?\)/) : null;
    if (m) return { store: `imagen de fondo: ${imageName(m[1])}`.slice(0, 200), show: "Imagen de fondo" };
  }
  const text = (el.textContent || "").trim().replace(/\s+/g, " ");
  const t = text ? text.slice(0, 120) : null;
  return { store: t, show: t };
}

// Sección/bloque que contiene al elemento, para comentar "toda esta sección".
function nearestSection(el: Element): Element {
  let node: Element | null = el;
  while (node && node !== document.body) {
    const tag = node.tagName.toLowerCase();
    if (tag === "section" || tag === "header" || tag === "footer" || node.hasAttribute("data-section")) return node;
    node = node.parentElement;
  }
  // Fallback: hijo directo de <main> (las bandas del sitio).
  const main = document.querySelector("main");
  if (main) {
    let n: Element | null = el;
    while (n && n.parentElement && n.parentElement !== main) n = n.parentElement;
    if (n && n.parentElement === main) return n;
  }
  return el.closest("section, main") || el;
}

export function FeedbackWidget() {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [commentMode, setCommentMode] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [scope, setScope] = useState<"element" | "section">("element");
  const [noteText, setNoteText] = useState("");
  const [sending, setSending] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [hoverRect, setHoverRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [total, setTotal] = useState(0);
  const [openPin, setOpenPin] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [docSize, setDocSize] = useState({ w: 0, h: 0 });
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const baseTextRef = useRef("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // Soporte de grabación de audio (para dictado por voz vía Whisper).
  useEffect(() => {
    setVoiceSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof window.MediaRecorder !== "undefined"
    );
  }, []);

  // Detiene el recorder. discard=true tira el audio (cierre del editor); false lo transcribe.
  const stopRecording = useCallback((discard: boolean) => {
    discardRef.current = discard;
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  const toggleVoice = useCallback(async () => {
    if (recording) {
      stopRecording(false);
      return;
    }
    if (!token) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      showToast("No se pudo acceder al micrófono");
      return;
    }
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    discardRef.current = false;
    baseTextRef.current = noteText;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (discardRef.current) return;
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
      if (blob.size === 0) return;
      setTranscribing(true);
      try {
        const fd = new FormData();
        fd.append("token", token);
        fd.append("audio", blob, "nota.webm");
        const res = await fetch("/api/feedback/transcribe", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.text) {
          const base = baseTextRef.current;
          setNoteText(base ? `${base} ${data.text}`.trim() : String(data.text).trim());
        } else {
          showToast("No se pudo transcribir, intenta de nuevo");
        }
      } catch {
        showToast("No se pudo transcribir, intenta de nuevo");
      } finally {
        setTranscribing(false);
      }
    };
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
  }, [recording, token, noteText, stopRecording, showToast]);

  // Si el editor se cierra (enviar, cerrar, salir del modo), tira la grabación en curso.
  useEffect(() => {
    if (!draft && recording) stopRecording(true);
  }, [draft, recording, stopRecording]);

  // Lee el token de la URL (?fb=) o de sessionStorage; limpia el query para que no se comparta por error.
  useEffect(() => {
    let tok: string | null = null;
    try {
      const sp = new URLSearchParams(window.location.search);
      const fromUrl = sp.get("fb");
      if (fromUrl) {
        tok = fromUrl;
        sessionStorage.setItem(TOKEN_KEY, fromUrl);
        sp.delete("fb");
        const qs = sp.toString();
        window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
      } else {
        tok = sessionStorage.getItem(TOKEN_KEY);
      }
    } catch {
      tok = null;
    }
    setToken(tok);
  }, []);

  const measure = useCallback(() => {
    const el = document.documentElement;
    setDocSize({ w: el.scrollWidth, h: el.scrollHeight });
  }, []);

  // Valida el token y trae los pines de la página actual.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/feedback?token=${encodeURIComponent(token)}&path=${encodeURIComponent(pathname)}`);
        if (!res.ok) {
          if (res.status === 401) {
            try {
              sessionStorage.removeItem(TOKEN_KEY);
            } catch {}
            if (!cancelled) {
              setToken(null);
              setReady(false);
            }
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setReady(true);
        setPins(Array.isArray(data.notes) ? data.notes : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
        measure();
      } catch {
        /* sin red: el widget simplemente no aparece */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, pathname, measure]);

  useEffect(() => {
    if (!ready) return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ready, measure]);

  // Modo comentarios persistente: mientras esté activo y sin editor abierto, cada
  // click agrega una nota (no hay que reactivarlo). Bloquea la navegación del sitio.
  useEffect(() => {
    if (!commentMode || draft) return;

    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (target && target.closest("[data-fb-ui]")) return; // deja pasar la UI propia
      e.preventDefault();
      e.stopPropagation();
      const el = target && target.nodeType === 1 ? target : null;
      const pageX = e.clientX + window.scrollX;
      const pageY = e.clientY + window.scrollY;
      const root = document.documentElement;
      const xPct = root.scrollWidth ? (pageX / root.scrollWidth) * 100 : 0;
      const yPct = root.scrollHeight ? (pageY / root.scrollHeight) * 100 : 0;
      const desc = el ? describeElement(el) : { store: null, show: null };
      let sectionSelector: string | null = null;
      let sectionStore: string | null = null;
      let sectionRect: Rect | null = null;
      if (el) {
        const sec = nearestSection(el);
        sectionSelector = cssPath(sec);
        const heading = sec.querySelector("h1, h2, h3")?.textContent?.trim();
        sectionStore = `sección: ${heading ? heading.slice(0, 120) : sectionSelector}`;
        const r = sec.getBoundingClientRect();
        // Coordenadas del documento (no del viewport) para que el resaltado siga a la
        // sección al hacer scroll y cubra su altura real.
        sectionRect = { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height };
      }
      setDraft({
        screen: { left: e.clientX, top: e.clientY },
        doc: { xPct, yPct },
        elementSelector: el ? cssPath(el) : null,
        elementStore: desc.store,
        elementShow: desc.show,
        sectionSelector,
        sectionStore,
        sectionRect,
      });
      setScope("element");
      setNoteText("");
      setHoverRect(null);
    }

    function onMove(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target || target.nodeType !== 1 || target.closest("[data-fb-ui]")) {
        setHoverRect(null);
        return;
      }
      const r = target.getBoundingClientRect();
      setHoverRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCommentMode(false);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("keydown", onKey);
      setHoverRect(null);
    };
  }, [commentMode, draft]);

  async function submit() {
    if (!draft || !token || !noteText.trim() || sending) return;
    const useSection = scope === "section" && !!draft.sectionSelector;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          path: pathname,
          note: noteText.trim(),
          selector: useSection ? draft.sectionSelector : draft.elementSelector,
          elementText: useSection ? draft.sectionStore : draft.elementStore,
          xPct: draft.doc.xPct,
          yPct: draft.doc.yPct,
          viewportW: window.innerWidth,
          pageTitle: document.title,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.id) {
        setPins((prev) => [
          { id: data.id, note: noteText.trim(), xPct: Math.round(draft.doc.xPct), yPct: Math.round(draft.doc.yPct), status: "open" },
          ...prev,
        ]);
        setTotal((t) => t + 1);
        setDraft(null);
        setNoteText("");
        showToast("Comentario enviado");
      } else {
        showToast("No se pudo enviar, intenta de nuevo");
      }
    } catch {
      showToast("No se pudo enviar, intenta de nuevo");
    } finally {
      setSending(false);
    }
  }

  if (!ready) return null;

  const editorLeft = Math.min(draft?.screen.left ?? 0, window.innerWidth - 380);
  const editorTop = Math.min(draft?.screen.top ?? 0, window.innerHeight - 220);

  return (
    <div data-fb-ui>
      {/* Pines existentes, posicionados sobre el documento */}
      {docSize.h > 0 && (
        <div className="pointer-events-none absolute left-0 top-0 z-[9990]" style={{ width: 0, height: 0 }}>
          {pins.map((p, i) =>
            p.xPct == null || p.yPct == null ? null : (
              <button
                key={p.id}
                type="button"
                data-fb-ui
                onClick={() => setOpenPin(openPin === p.id ? null : p.id)}
                className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold shadow-lg ring-2 ring-black/40 transition ${
                  p.status === "resolved" ? "bg-emerald-600 text-white" : "bg-[#2e7d6b] text-white"
                }`}
                style={{ left: (p.xPct / 100) * docSize.w, top: (p.yPct / 100) * docSize.h }}
                aria-label={`Comentario ${i + 1}`}
              >
                {p.status === "resolved" ? <Check className="size-3.5" /> : i + 1}
                {openPin === p.id && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/15 bg-[#241e17] px-3 py-2 text-left text-[12px] font-normal leading-snug text-[#f2e7d6] shadow-xl">
                    {p.note}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      )}

      {/* Resaltado del elemento bajo el cursor en modo comentarios */}
      {commentMode && !draft && hoverRect && (
        <div
          data-fb-ui
          aria-hidden
          className="pointer-events-none fixed z-[9993] rounded-[3px] border-2 border-[#2e7d6b] bg-[#2e7d6b]/10 transition-[top,left,width,height] duration-75"
          style={{ top: hoverRect.top, left: hoverRect.left, width: hoverRect.width, height: hoverRect.height }}
        />
      )}

      {/* Resaltado de la sección completa cuando el toggle está en "sección".
          Posición absoluta en el documento: sigue a la sección al hacer scroll. */}
      {draft && scope === "section" && draft.sectionRect && (
        <div
          data-fb-ui
          aria-hidden
          className="pointer-events-none absolute z-[9993] rounded-[3px] border-2 border-[#2e7d6b] bg-[#2e7d6b]/10"
          style={{ top: draft.sectionRect.top, left: draft.sectionRect.left, width: draft.sectionRect.width, height: draft.sectionRect.height }}
        />
      )}

      {/* Banner del modo comentarios */}
      {commentMode && !draft && (
        <div
          data-fb-ui
          className="fixed inset-x-0 top-0 z-[9995] flex items-center justify-center gap-3 bg-[#2e7d6b] px-4 py-2 text-[13px] font-medium text-white"
        >
          Modo comentarios activo · pasa el cursor y haz click en lo que quieras comentar
          <button type="button" data-fb-ui onClick={() => setCommentMode(false)} className="rounded-md bg-black/15 px-2 py-0.5 text-[12px] hover:bg-black/25">
            Salir (Esc)
          </button>
        </div>
      )}

      {/* Editor de nota */}
      {draft && (
        <div
          data-fb-ui
          className="fixed z-[9996] w-[360px] rounded-xl border border-white/15 bg-[#241e17] p-3 shadow-2xl"
          style={{ left: Math.max(12, editorLeft), top: Math.max(12, editorTop) }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Nuevo comentario</span>
            <button type="button" data-fb-ui onClick={() => setDraft(null)} className="text-white/50 hover:text-[#f2e7d6]" aria-label="Cerrar">
              <X className="size-4" />
            </button>
          </div>
          {draft.sectionSelector && (
            <div className="mb-2 inline-flex rounded-lg border border-white/15 p-0.5 text-[11px]">
              <button
                type="button"
                data-fb-ui
                onClick={() => setScope("element")}
                className={`rounded-md px-2 py-1 transition ${scope === "element" ? "bg-[#2e7d6b] text-white" : "text-white/50 hover:text-[#f2e7d6]"}`}
              >
                Este elemento
              </button>
              <button
                type="button"
                data-fb-ui
                onClick={() => setScope("section")}
                className={`rounded-md px-2 py-1 transition ${scope === "section" ? "bg-[#2e7d6b] text-white" : "text-white/50 hover:text-[#f2e7d6]"}`}
              >
                Toda la sección
              </button>
            </div>
          )}
          {scope === "element"
            ? draft.elementShow && (
                <p className="mb-2 line-clamp-2 rounded-md bg-black/20 px-2 py-1 text-[11px] text-white/50">{draft.elementShow}</p>
              )
            : (
              <p className="mb-2 rounded-md bg-black/20 px-2 py-1 text-[11px] text-white/50">Comentario sobre toda la sección resaltada</p>
            )}
          <textarea
            data-fb-ui
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
            }}
            placeholder="¿Qué quieres comentar de esta parte?"
            rows={4}
            className="w-full resize-none rounded-lg border border-white/15 bg-[#1b1712] px-2.5 py-2 text-[13px] text-[#f4efe6] placeholder:text-white/40 focus:border-[#2e7d6b] focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            {voiceSupported ? (
              <button
                type="button"
                data-fb-ui
                onClick={toggleVoice}
                disabled={transcribing}
                aria-label={recording ? "Detener y transcribir" : "Dictar por voz"}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition disabled:opacity-60 ${
                  recording
                    ? "animate-pulse border-[#2e7d6b] bg-[#2e7d6b]/15 text-[#5cc0a8]"
                    : "border-white/15 text-white/50 hover:text-[#f2e7d6]"
                }`}
              >
                {transcribing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : recording ? (
                  <Square className="size-3.5" />
                ) : (
                  <Mic className="size-3.5" />
                )}
                {transcribing ? "Transcribiendo…" : recording ? "Grabando…" : "Dictar"}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              data-fb-ui
              onClick={submit}
              disabled={!noteText.trim() || sending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2e7d6b] px-3 py-1.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-3.5" />
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      )}

      {/* Toggle del modo comentarios (persistente) */}
      {commentMode ? (
        <button
          type="button"
          data-fb-ui
          onClick={() => {
            setCommentMode(false);
            setDraft(null);
          }}
          className="fixed bottom-5 left-5 z-[9994] inline-flex items-center gap-2 rounded-full border border-[#2e7d6b] bg-[#1b1712] px-4 py-2.5 text-[13px] font-medium text-[#5cc0a8] shadow-xl transition hover:bg-[#241e17]"
        >
          <X className="size-4" />
          Salir del modo comentarios
        </button>
      ) : (
        <button
          type="button"
          data-fb-ui
          onClick={() => {
            setOpenPin(null);
            setCommentMode(true);
          }}
          className="fixed bottom-5 left-5 z-[9994] inline-flex items-center gap-2 rounded-full bg-[#2e7d6b] px-4 py-2.5 text-[13px] font-medium text-white shadow-xl transition hover:opacity-90"
        >
          <MessageSquarePlus className="size-4" />
          Comentar
          {total > 0 && (
            <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-[11px] font-semibold tabular-nums">
              {total}
            </span>
          )}
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div data-fb-ui className="fixed bottom-5 left-1/2 z-[9997] -translate-x-1/2 rounded-full bg-[#f2e7d6] px-4 py-2 text-[13px] font-medium text-[#241e17] shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
