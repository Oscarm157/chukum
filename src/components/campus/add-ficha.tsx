"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Check, AlertCircle, FileText } from "lucide-react";

type Step = "form" | "preview" | "done";

export function AddFicha() {
  const [step, setStep] = useState<Step>("form");

  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [tema, setTema] = useState("");

  const [markdown, setMarkdown] = useState("");
  const [pathPreview, setPathPreview] = useState("");
  const [savedPath, setSavedPath] = useState("");

  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorLabel = (code: string): string => {
    const map: Record<string, string> = {
      no_autorizado: "Tu sesión del gate expiró. Vuelve a entrar con la contraseña.",
      falta_anthropic_key: "Falta ANTHROPIC_API_KEY en el servidor.",
      falta_github_token: "Falta GITHUB_TOKEN en el servidor.",
      fallo_ia: "La IA no respondió. Intenta de nuevo.",
      salida_invalida: "La IA devolvió algo fuera de formato. Intenta de nuevo.",
      fallo_github_listar: "No se pudo leer la carpeta del tema en GitHub.",
      fallo_github_commit: "GitHub rechazó el commit. Revisa el token.",
      ya_existe: "Ya existe una ficha con ese número o nombre. Cambia el título.",
      faltan_tema_o_titulo: "El markdown no tiene tema o título en el frontmatter.",
    };
    return map[code] ?? code;
  };

  async function handleProcess() {
    setError(null);
    setProcessing(true);
    try {
      const res = await fetch("/campus/agregar/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          title: title || undefined,
          tema: tema || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(errorLabel(data.error ?? "error"));
        return;
      }
      setMarkdown(data.markdown);
      setPathPreview(data.path);
      setStep("preview");
    } catch {
      setError("No se pudo conectar. Revisa tu red e intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/campus/agregar/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(errorLabel(data.error ?? "error"));
        return;
      }
      setSavedPath(data.path);
      setStep("done");
    } catch {
      setError("No se pudo conectar. Revisa tu red e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
      <Link
        href="/campus"
        className="inline-flex items-center gap-1.5 text-sm text-ink-mute transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Base de conocimientos
      </Link>

      <header className="kb-fade mt-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
          Campus Chukum
        </p>
        <h1 className="mt-2.5 font-serif text-[2.1rem] leading-[1.1] tracking-tight text-ink sm:text-[2.6rem]">
          Agregar video
        </h1>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-soft">
          Pega el transcript del video. La IA lo pasa al formato de ficha; tú lo
          revisas y editas antes de guardarlo al repo.
        </p>
      </header>

      {error && (
        <div className="kb-fade mt-6 flex items-start gap-2.5 rounded-xl border border-line-strong bg-surface p-3.5 text-[0.92rem] text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Paso 1: transcript */}
      {step === "form" && (
        <div className="kb-fade mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="transcript" className="mb-2 block text-sm font-medium text-ink">
              Transcript
            </label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={14}
              placeholder="Pega aquí el transcript crudo del video (con o sin timestamps)."
              className="w-full resize-y rounded-xl border border-line-strong bg-surface p-4 text-[0.95rem] leading-relaxed text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-accent focus:ring-4 focus:ring-accent-tint"
            />
            <p className="mt-1.5 text-xs text-ink-mute tabular-nums">
              {transcript.trim().length.toLocaleString("es-MX")} / 20,000 caracteres
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-ink">
                Título <span className="font-normal text-ink-mute">(opcional)</span>
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Si lo dejas vacío, la IA lo infiere"
                className="w-full rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-accent focus:ring-4 focus:ring-accent-tint"
              />
            </div>
            <div>
              <label htmlFor="tema" className="mb-2 block text-sm font-medium text-ink">
                Tema <span className="font-normal text-ink-mute">(opcional)</span>
              </label>
              <input
                id="tema"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Inducción, Producto, Medios…"
                className="w-full rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-accent focus:ring-4 focus:ring-accent-tint"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleProcess}
            disabled={processing || transcript.trim().length < 40}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-accent px-5 py-3 text-[0.95rem] font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-accent-soft active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Procesar
              </>
            )}
          </button>
        </div>
      )}

      {/* Paso 2: preview editable */}
      {step === "preview" && (
        <div className="kb-fade mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <FileText className="size-4 text-accent" />
              Revisa y edita la ficha
            </div>
            {pathPreview && (
              <code className="rounded-md bg-surface-2 px-2 py-1 text-[0.72rem] text-ink-mute">
                {pathPreview}
              </code>
            )}
          </div>

          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={26}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-line-strong bg-surface p-4 font-mono text-[0.85rem] leading-relaxed text-ink outline-none transition-[border-color,box-shadow] focus:border-accent focus:ring-4 focus:ring-accent-tint"
          />
          <p className="text-xs text-ink-mute">
            El número de video y el nombre del archivo se recalculan al guardar según
            las fichas que ya existen en ese tema.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-[0.95rem] font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-accent-soft active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Guardar
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError(null);
              }}
              disabled={saving}
              className="rounded-xl border border-line-strong bg-surface px-4 py-3 text-[0.95rem] font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            >
              Volver al transcript
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: guardado */}
      {step === "done" && (
        <div className="kb-fade mt-8 rounded-2xl border border-line bg-surface p-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-accent-tint text-accent">
            <Check className="size-5" />
          </div>
          <h2 className="mt-4 font-serif text-[1.4rem] tracking-tight text-ink">
            Ficha guardada
          </h2>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
            Se commiteó al repo. Aparece en <span className="font-medium text-ink">/campus</span> en
            aproximadamente 1 minuto, cuando termine el deploy.
          </p>
          {savedPath && (
            <code className="mt-3 inline-block rounded-md bg-surface-2 px-2 py-1 text-[0.75rem] text-ink-mute">
              {savedPath}
            </code>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setTranscript("");
                setTitle("");
                setTema("");
                setMarkdown("");
                setPathPreview("");
                setSavedPath("");
                setError(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[0.95rem] font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-accent-soft active:translate-y-px"
            >
              <Sparkles className="size-4" />
              Agregar otro
            </button>
            <Link
              href="/campus"
              className="inline-flex items-center rounded-xl border border-line-strong bg-surface px-4 py-3 text-[0.95rem] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Volver al índice
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
