"use client";

import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Loader2, Crop } from "lucide-react";
import { Modal } from "@/components/crm/Modal";
import { BRAND } from "@/lib/site";

/**
 * Recorte de la imagen del post en el navegador: se elige formato y zoom, y al aplicar
 * el canvas resuelve un JPEG que el llamador sube a Blob. No escribe nada por su cuenta.
 */

const FORMATOS = [
  { ratio: "1:1", valor: 1, label: "Feed cuadrado" },
  { ratio: "4:5", valor: 4 / 5, label: "Feed vertical" },
  { ratio: "9:16", valor: 9 / 16, label: "Story/Reel" },
] as const;

// Tope del lado largo del recorte. Instagram no muestra más de ~1440px de ancho y un
// JPEG de 4000px se pasa del límite de 8MB de `uploadImage`.
const MAX_LADO = 2048;

export function ImageCropper({
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
  onAplicar: (file: File, formato: string) => void | Promise<void>;
}) {
  const [formato, setFormato] = useState<(typeof FORMATOS)[number]>(FORMATOS[0]);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [cargada, setCargada] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Las fotos del catálogo se guardan con la URL absoluta del sitio. Servidas desde el
  // mismo origen el canvas puede leerlas; con el dominio completo, en local serían
  // cross-origin y el recorte fallaría por tainted canvas.
  const fuente = src.startsWith(BRAND.url) ? src.slice(BRAND.url.length) : src;

  // Cada apertura (y cada imagen distinta) arranca con el encuadre en cero. Se ajusta en
  // el render, no en un efecto: así no hay un frame con el estado del recorte anterior.
  const sesion = open ? src : "";
  const [sesionPrevia, setSesionPrevia] = useState(sesion);
  if (sesionPrevia !== sesion) {
    setSesionPrevia(sesion);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPx(null);
    setCargada(false);
    setError(null);
  }

  async function aplicar() {
    if (!areaPx) return;
    setProcesando(true);
    setError(null);
    try {
      const blob = await recortar(fuente, areaPx);
      const file = new File([blob], `recorte-${Date.now()}.jpg`, { type: "image/jpeg" });
      await onAplicar(file, formato.ratio);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo recortar la imagen.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recortar imagen"
      maxWidth={560}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={procesando} className="crm-btn crm-btn-sm crm-btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={aplicar}
            disabled={procesando || !areaPx}
            className="crm-btn crm-btn-sm crm-btn-primary"
          >
            {procesando ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Crop className="size-3.5" strokeWidth={2} />
            )}
            Aplicar recorte
          </button>
        </div>
      }
    >
      <div role="radiogroup" aria-label="Formato de la imagen" className="mb-3 flex flex-wrap gap-2">
        {FORMATOS.map((f) => (
          <label
            key={f.ratio}
            className="crm-tab cursor-pointer focus-within:ring-2 focus-within:ring-[var(--crm-accent-ring)]"
            data-active={formato.ratio === f.ratio}
          >
            <input
              type="radio"
              name="formato"
              value={f.ratio}
              checked={formato.ratio === f.ratio}
              onChange={() => {
                setFormato(f);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }}
              className="sr-only"
            />
            {f.label}
            <span className="crm-num text-[12px] text-[var(--crm-ink-mute)]">{f.ratio}</span>
          </label>
        ))}
      </div>

      <div className="relative h-[300px] overflow-hidden rounded-lg border border-[var(--crm-line)] bg-[var(--crm-surface)] sm:h-[360px]">
        <Cropper
          image={fuente}
          crop={crop}
          zoom={zoom}
          aspect={formato.valor}
          // La foto llena el marco desde el inicio: con `contain` arrancaría chica y con
          // franjas vacías dentro del área de recorte.
          objectFit="cover"
          minZoom={1}
          maxZoom={4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, px) => setAreaPx(px)}
          onMediaLoaded={() => setCargada(true)}
          mediaProps={{
            crossOrigin: "anonymous",
            onError: () => setError("No se pudo cargar la imagen para recortarla."),
          }}
          style={{ containerStyle: { background: "var(--crm-surface)" } }}
        />
        {!cargada && !error && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[var(--crm-surface)] text-[13px] text-[var(--crm-ink-mute)]">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Cargando la imagen…
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label htmlFor="zoom" className="text-[12.5px] text-[var(--crm-ink-soft)]">
          Escala
        </label>
        <input
          id="zoom"
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1 flex-1 accent-[var(--crm-accent-strong)]"
        />
        <span className="crm-num w-[42px] text-right text-[12.5px] text-[var(--crm-ink-mute)]">
          {zoom.toFixed(2)}x
        </span>
      </div>

      <p className="mt-2 text-[12px] leading-snug text-[var(--crm-ink-mute)]">
        Arrastra la foto para mover el encuadre. Lo que queda fuera del marco no se publica. Se guarda en{" "}
        <span className="crm-num">{formato.ratio}</span>, máximo <span className="crm-num">{MAX_LADO}</span> px de lado.
      </p>

      {error && (
        <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </Modal>
  );
}

// Dibuja solo el área elegida en un canvas y lo resuelve como JPEG.
async function recortar(src: string, area: Area): Promise<Blob> {
  const img = await cargarImagen(src);

  const escala = Math.min(1, MAX_LADO / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * escala);
  canvas.height = Math.round(area.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no pudo preparar el recorte.");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen recortada."))),
        "image/jpeg",
        0.92
      );
    } catch {
      // Tainted canvas: la imagen vino de otro origen sin permiso de lectura.
      reject(new Error("Esta imagen no se puede recortar desde el navegador por su origen."));
    }
  });
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen para recortarla."));
    img.src = src;
  });
}
