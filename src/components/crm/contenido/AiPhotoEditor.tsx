"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Check, RotateCcw } from "lucide-react";
import { Modal } from "@/components/crm/Modal";
import { generarEdicionIA } from "@/app/admin/(panel)/contenido/actions";
import { mismoOrigen, cargarImagen } from "@/components/crm/contenido/imagen";

/**
 * Edición de la foto del post con Nano Banana Pro: se escribe qué cambiar, se ve el
 * resultado contra el original y solo al aceptar se aplica. Mismo contrato que los otros
 * dos editores: entrega un `File` y el llamador decide si lo sube o lo guarda.
 */

// Tope del lado largo de la foto que se manda a editar cuando todavía es un archivo local
// (pantalla de alta). El cuerpo de un server action no puede pasar de 1MB; el resultado
// vuelve en 2K de todos modos, así que reducir la entrada no baja la calidad de salida.
const MAX_LADO_ENVIO = 1400;

// Las dos fotos van en cajas idénticas: comparar sirve solo si se ven al mismo tamaño.
// En pantalla angosta se achican para que el resultado no quede abajo del pliegue.
const CAJA =
  "flex h-[132px] w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--crm-line)] p-2 text-center sm:h-[210px]";

export function AiPhotoEditor({
  open,
  src,
  onClose,
  onAplicar,
}: {
  open: boolean;
  /** Object URL de un archivo local o URL ya persistida del post. */
  src: string;
  onClose: () => void;
  /** Si lanza un Error, su mensaje se muestra dentro del modal. */
  onAplicar: (file: File) => void | Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Una generación tarda entre 30s y ~100s. Si el modal se cierra o se relanza mientras
  // corre, la respuesta que llega tarde no debe pintarse sobre una sesión que ya no es suya.
  const intentoRef = useRef(0);
  useEffect(() => {
    intentoRef.current++;
  }, [open, src]);

  // Cada apertura (y cada imagen distinta) arranca en blanco, igual que el recorte.
  const sesion = open ? src : "";
  const [sesionPrevia, setSesionPrevia] = useState(sesion);
  if (sesionPrevia !== sesion) {
    setSesionPrevia(sesion);
    setPrompt("");
    setResultado(null);
    setError(null);
    setGenerando(false);
  }

  const ocupado = generando || aplicando;

  async function generar() {
    const instruccion = prompt.trim();
    const mio = ++intentoRef.current;
    setGenerando(true);
    setResultado(null);
    setError(null);
    try {
      const res = await generarEdicionIA({ prompt: instruccion, ...(await fuente(src)) });
      if (intentoRef.current !== mio) return;
      if ("error" in res) setError(res.error);
      else setResultado(res.resultUrl);
    } catch (e) {
      if (intentoRef.current !== mio) return;
      setError(e instanceof Error ? e.message : "No se pudo editar la foto.");
    } finally {
      if (intentoRef.current === mio) setGenerando(false);
    }
  }

  // El resultado vive en un enlace temporal de Replicate: se descarga aquí y se entrega
  // como archivo, igual que el recorte y el overlay. Si se descarta, no hay nada que borrar.
  async function aceptar() {
    if (!resultado) return;
    setAplicando(true);
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
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar con IA"
      maxWidth={640}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} disabled={ocupado} className="crm-btn crm-btn-sm crm-btn-ghost">
            {resultado ? "Descartar" : "Cancelar"}
          </button>
          <button
            type="button"
            onClick={generar}
            disabled={ocupado || prompt.trim().length < 3}
            className={resultado ? "crm-btn crm-btn-sm crm-btn-secondary" : "crm-btn crm-btn-sm crm-btn-primary"}
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
            <button
              type="button"
              onClick={aceptar}
              disabled={ocupado}
              className="crm-btn crm-btn-sm crm-btn-primary"
            >
              {aplicando ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Check className="size-3.5" strokeWidth={2} />
              )}
              Aceptar
            </button>
          )}
        </div>
      }
    >
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
          <figcaption className="mb-1.5 text-[12px] text-[var(--crm-ink-mute)]">Original</figcaption>
          <div className={CAJA} style={{ background: "var(--crm-surface)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        </figure>
        <figure className="m-0">
          <figcaption className="mb-1.5 text-[12px] text-[var(--crm-ink-mute)]">Resultado</figcaption>
          <div className={CAJA} style={{ background: "var(--crm-surface)" }}>
            {generando ? (
              <p className="flex flex-col items-center gap-2 text-[12.5px] leading-snug text-[var(--crm-ink-mute)]">
                <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                Editando la foto. Tarda entre 30 segundos y dos minutos, no cierres esta ventana.
              </p>
            ) : resultado ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={resultado} alt="Foto editada" className="max-h-full max-w-full object-contain" />
            ) : (
              <p className="text-[12.5px] leading-snug text-[var(--crm-ink-mute)]">
                Aquí aparece la versión editada para compararla antes de aceptarla.
              </p>
            )}
          </div>
        </figure>
      </div>

      {error && (
        <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </Modal>
  );
}

// El servidor descarga la foto cuando ya vive en una URL. Un object URL local solo existe
// en esta pestaña, así que en ese caso se manda el archivo, reducido para no pasarse del
// límite de 1MB del server action.
async function fuente(src: string): Promise<{ imageUrl: string } | { imageFile: File }> {
  if (src.startsWith("http://") || src.startsWith("https://")) return { imageUrl: src };

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
