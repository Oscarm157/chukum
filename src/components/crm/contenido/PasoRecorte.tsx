"use client";

import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Loader2, Crop } from "lucide-react";
import { MAX_LADO, mismoOrigen, cargarImagen } from "@/components/crm/contenido/imagen";
import { PasoLayout, controlLabel } from "@/components/crm/contenido/PasoLayout";

/**
 * Paso de recorte del `ImageWorkspace`: se elige formato y zoom, y al aplicar el canvas
 * resuelve un JPEG que pasa a ser la imagen de trabajo. No sube ni guarda nada.
 *
 * El formato, la escala y el botón viven en la columna de controles; el recuadro de
 * encuadre se queda con todo el espacio del lienzo.
 */

const FORMATOS = [
  { ratio: "1:1", valor: 1, label: "Feed cuadrado" },
  { ratio: "4:5", valor: 4 / 5, label: "Feed vertical" },
  { ratio: "9:16", valor: 9 / 16, label: "Story/Reel" },
] as const;

export function PasoRecorte({
  src,
  pestanas,
  onAplicar,
  onBusy,
}: {
  /** Imagen de trabajo actual: object URL local o URL ya persistida. */
  src: string;
  /** Selector de paso del workspace; se pinta arriba de la columna de controles. */
  pestanas: React.ReactNode;
  onAplicar: (file: File, formato: string) => void | Promise<void>;
  onBusy: (busy: boolean) => void;
}) {
  const [formato, setFormato] = useState<(typeof FORMATOS)[number]>(FORMATOS[0]);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [cargada, setCargada] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fuente = mismoOrigen(src);

  // Cada imagen nueva (la propia salida de este paso, o la del paso anterior) arranca con
  // el encuadre en cero. Se ajusta en el render, no en un efecto: así no hay un frame con
  // el estado del recorte anterior.
  const [srcPrevio, setSrcPrevio] = useState(src);
  if (srcPrevio !== src) {
    setSrcPrevio(src);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPx(null);
    setCargada(false);
    setError(null);
  }

  async function aplicar() {
    if (!areaPx) return;
    setProcesando(true);
    onBusy(true);
    setError(null);
    try {
      const blob = await recortar(fuente, areaPx);
      const file = new File([blob], `recorte-${Date.now()}.jpg`, { type: "image/jpeg" });
      await onAplicar(file, formato.ratio);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo recortar la imagen.");
    } finally {
      setProcesando(false);
      onBusy(false);
    }
  }

  return (
    <PasoLayout
      pestanas={pestanas}
      error={error}
      controles={
        <>
          <div role="radiogroup" aria-label="Formato de la imagen" className="flex flex-col gap-1.5">
            <span className={controlLabel}>Formato</span>
            {FORMATOS.map((f) => (
              <label
                key={f.ratio}
                className="crm-tab flex w-full cursor-pointer justify-between focus-within:ring-2 focus-within:ring-[var(--crm-accent-ring)]"
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

          <div className="mt-5">
            <label htmlFor="zoom" className={controlLabel}>
              Escala
            </label>
            <div className="flex items-center gap-3">
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
          </div>

          <p className="mt-5 text-[12px] leading-snug text-[var(--crm-ink-mute)]">
            Arrastra la foto para mover el encuadre. Queda en <span className="crm-num">{formato.ratio}</span>, máximo{" "}
            <span className="crm-num">{MAX_LADO}</span> px de lado.
          </p>
        </>
      }
      acciones={
        <button
          type="button"
          onClick={aplicar}
          disabled={procesando || !areaPx}
          className="crm-btn crm-btn-sm crm-btn-secondary w-full"
        >
          {procesando ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Crop className="size-3.5" strokeWidth={2} />
          )}
          Aplicar recorte
        </button>
      }
      lienzo={
        // Alto fijo en angosto; desde lg se estira con la columna y el encuadre se ve grande.
        <div className="relative h-[300px] w-full overflow-hidden rounded-lg border border-[var(--crm-line)] bg-[var(--crm-surface)] sm:h-[380px] lg:h-auto lg:min-h-0 lg:flex-1">
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
      }
    />
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
