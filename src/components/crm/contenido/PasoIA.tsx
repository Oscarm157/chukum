"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Check, RotateCcw, Maximize2 } from "lucide-react";
import { generarEdicionIA } from "@/app/admin/(panel)/contenido/actions";
import { mismoOrigen, cargarImagen } from "@/components/crm/contenido/imagen";

/**
 * Paso de edición con IA del `ImageWorkspace`: se escribe qué cambiar, se ve el resultado
 * contra la imagen de trabajo y solo al aceptarlo pasa a serla. Genera en Replicate (única
 * parte que sí pega al servidor), pero no guarda nada en Blob ni en la base.
 */

// Tope del lado largo de la foto que se manda a editar cuando todavía es un archivo local
// (pantalla de alta o resultado de un paso anterior). El cuerpo de un server action no
// puede pasar de 1MB; el resultado vuelve en 2K de todos modos.
const MAX_LADO_ENVIO = 1400;

// Las dos fotos van en cajas idénticas: comparar sirve solo si se ven al mismo tamaño.
// En pantalla angosta se achican para que el resultado no quede abajo del pliegue.
const CAJA =
  "group relative flex h-[132px] w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--crm-line)] p-2 text-center sm:h-[200px]";

export function PasoIA({
  src,
  onAplicar,
  onBusy,
  onVer,
}: {
  /** Imagen de trabajo actual: object URL local o URL ya persistida. */
  src: string;
  onAplicar: (file: File) => void | Promise<void>;
  onBusy: (busy: boolean) => void;
  /** Abre el lightbox del workspace para comparar en grande. */
  onVer: (url: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  // Historial de intentos de esta sesión (no se persiste): reintentar no debe borrar lo
  // ya generado, solo perderlo era la queja real de Oscar probando este paso.
  const [intentos, setIntentos] = useState<string[]>([]);
  const [generando, setGenerando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Una generación tarda entre 30s y ~100s. Si la imagen de trabajo cambia mientras corre,
  // la respuesta que llega tarde no debe pintarse sobre una sesión que ya no es suya: el
  // ref guarda cuál es la imagen vigente al momento de resolver.
  const vigenteRef = useRef(src);
  useEffect(() => {
    vigenteRef.current = src;
  }, [src]);

  // Cada imagen de trabajo nueva arranca el paso en blanco.
  const [srcPrevio, setSrcPrevio] = useState(src);
  if (srcPrevio !== src) {
    setSrcPrevio(src);
    setPrompt("");
    setResultado(null);
    setIntentos([]);
    setError(null);
    setGenerando(false);
  }

  const ocupado = generando || aplicando;

  async function generar() {
    const instruccion = prompt.trim();
    const mia = src;
    setGenerando(true);
    onBusy(true);
    setResultado(null);
    setError(null);
    try {
      const res = await generarEdicionIA({ prompt: instruccion, ...(await fuente(mia)) });
      if (vigenteRef.current !== mia) return;
      if ("error" in res) setError(res.error);
      else {
        setResultado(res.resultUrl);
        // Los últimos 4 intentos de esta sesión, el más nuevo primero, sin duplicar el
        // que ya estaba mostrado.
        setIntentos((prev) => [res.resultUrl, ...prev.filter((u) => u !== res.resultUrl)].slice(0, 4));
      }
    } catch (e) {
      if (vigenteRef.current !== mia) return;
      setError(e instanceof Error ? e.message : "No se pudo editar la foto.");
    } finally {
      if (vigenteRef.current === mia) setGenerando(false);
      onBusy(false);
    }
  }

  // El resultado vive en un enlace temporal de Replicate: se descarga aquí y pasa a ser la
  // imagen de trabajo, en memoria. Si se descarta, no hay nada que borrar.
  async function aceptar() {
    if (!resultado) return;
    setAplicando(true);
    onBusy(true);
    setError(null);
    try {
      const res = await fetch(resultado);
      if (!res.ok) throw new Error("Ya no se pudo descargar la imagen editada. Vuelve a generarla.");
      const blob = await res.blob();
      await onAplicar(new File([blob], `ia-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo aplicar la imagen editada.");
    } finally {
      setAplicando(false);
      onBusy(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]" htmlFor="ia-prompt">
        Qué quieres cambiar
      </label>
      <textarea
        id="ia-prompt"
        rows={3}
        maxLength={300}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={ocupado}
        className="crm-textarea"
        placeholder="Ejemplos: quita el letrero del fondo, cambia el cielo a un atardecer suave, aclara la imagen."
      />
      <p className="mt-1.5 text-[12px] leading-snug text-[var(--crm-ink-mute)]">
        <span className="crm-num">{prompt.length}</span>/300. Es edición de la foto real, no un retoque garantizado:
        puede salir distinto a lo que pediste. Cada intento genera una imagen nueva en Replicate y tiene costo.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <figure className="m-0">
          <figcaption className="mb-1.5 text-[12px] text-[var(--crm-ink-mute)]">Imagen de trabajo</figcaption>
          <button type="button" onClick={() => onVer(src)} className={CAJA} style={{ background: "var(--crm-surface)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="max-h-full max-w-full object-contain" />
            <VerEnGrande />
          </button>
        </figure>
        <figure className="m-0">
          <figcaption className="mb-1.5 text-[12px] text-[var(--crm-ink-mute)]">Resultado</figcaption>
          {resultado ? (
            <button
              type="button"
              onClick={() => onVer(resultado)}
              className={CAJA}
              style={{ background: "var(--crm-surface)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultado} alt="Foto editada" className="max-h-full max-w-full object-contain" />
              <VerEnGrande />
            </button>
          ) : (
            <div className={CAJA} style={{ background: "var(--crm-surface)" }}>
              {generando ? (
                <p className="flex flex-col items-center gap-2 text-[12.5px] leading-snug text-[var(--crm-ink-mute)]">
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                  Editando la foto. Tarda entre 30 segundos y dos minutos, no cierres esta ventana.
                </p>
              ) : (
                <p className="text-[12.5px] leading-snug text-[var(--crm-ink-mute)]">
                  Aquí aparece la versión editada para compararla antes de aceptarla.
                </p>
              )}
            </div>
          )}
        </figure>
      </div>

      {intentos.length > 1 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] text-[var(--crm-ink-mute)]">Intentos de esta sesión</p>
          <div className="flex flex-wrap gap-2">
            {intentos.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setResultado(url)}
                aria-label="Usar este intento"
                className="size-12 shrink-0 overflow-hidden rounded-md border-2 p-0"
                style={{ borderColor: url === resultado ? "var(--crm-accent-strong)" : "var(--crm-line)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pegada al borde inferior del cuerpo del modal, igual que los otros dos pasos. */}
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--crm-line)] bg-[var(--crm-surface-2)] px-6 py-2.5">
        <button
          type="button"
          onClick={generar}
          disabled={ocupado || prompt.trim().length < 3}
          className="crm-btn crm-btn-sm crm-btn-secondary"
        >
          {generando ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : resultado ? (
            <RotateCcw className="size-3.5" strokeWidth={2} />
          ) : (
            <Sparkles className="size-3.5" strokeWidth={2} />
          )}
          {generando ? "Generando…" : resultado ? "Reintentar" : "Generar"}
        </button>
        {resultado && (
          <button type="button" onClick={aceptar} disabled={ocupado} className="crm-btn crm-btn-sm crm-btn-secondary">
            {aplicando ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Check className="size-3.5" strokeWidth={2} />
            )}
            Usar esta versión
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function VerEnGrande() {
  return (
    <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
      <Maximize2 className="size-3.5" strokeWidth={2} />
    </span>
  );
}

// Siempre se re-dibuja en canvas antes de mandarla, sin importar si ya es una URL o un
// object URL local: el navegador respeta la orientación EXIF al decodificar la imagen,
// pero si se manda la URL tal cual para que el servidor la vuelva a bajar en crudo, esa
// orientación se pierde y el resultado de Replicate sale rotado respecto a lo que se ve
// en pantalla (bug real, visto editando con IA como primer paso antes de recortar).
async function fuente(src: string): Promise<{ imageFile: File }> {
  const img = await cargarImagen(mismoOrigen(src));
  const escala = Math.min(1, MAX_LADO_ENVIO / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * escala);
  canvas.height = Math.round(img.naturalHeight * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no pudo preparar la imagen.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("No se pudo preparar la imagen para editarla."))),
        "image/jpeg",
        0.85
      );
    } catch {
      reject(new Error("Esta imagen no se puede editar desde el navegador por su origen."));
    }
  });
  return { imageFile: new File([blob], `origen-${Date.now()}.jpg`, { type: "image/jpeg" }) };
}
