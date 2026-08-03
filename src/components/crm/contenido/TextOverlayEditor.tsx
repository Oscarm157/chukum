"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Pattern, type FabricObject } from "fabric";
import { Loader2, Type } from "lucide-react";
import { Modal } from "@/components/crm/Modal";
import { fraunces, inter } from "@/lib/contenido/fonts";
import { MAX_LADO, mismoOrigen, cargarImagen } from "@/components/crm/contenido/imagen";
import {
  construirPlantilla,
  sincronizarTextos,
  ajustarCajaBadge,
  GRANO_SVG,
  PLANTILLAS,
  type Composicion,
  type PlantillaId,
} from "@/components/crm/contenido/plantillas";

/**
 * Overlay de texto sobre la imagen del post: se elige una de las tres plantillas del
 * sistema de diseño, se escribe el texto en los campos y se arrastra dentro de la zona
 * segura. Al aplicar exporta un JPEG aplanado que el llamador sube; la "receta"
 * (plantilla, texto, posición) no se guarda.
 */

// Resolución de trabajo del canvas. La exportación sube a `MAX_LADO` con el multiplicador
// de fabric, así que dibujar aquí a 1080 mantiene el editor fluido sin perder calidad.
const LADO_DISENO = 1080;
// Caja donde se muestra el canvas dentro del modal. En pantalla angosta se achica para
// que los campos de texto no queden abajo del pliegue.
function cajaVista() {
  const angosta = window.innerWidth < 640;
  return { ancho: Math.min(520, window.innerWidth - 96), alto: angosta ? 260 : 360 };
}

const labelCls = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";

export function TextOverlayEditor({
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
  const [plantilla, setPlantilla] = useState<PlantillaId>("banda");
  const [headline, setHeadline] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [badge, setBadge] = useState("");
  const [listo, setListo] = useState(false);
  const [altoVista, setAltoVista] = useState(320);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El modal monta su contenido en un portal después del primer render: con un ref normal
  // el efecto correría antes de que exista el <canvas>. Con estado se dispara al montarlo.
  const [el, setEl] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const compRef = useRef<Composicion | null>(null);
  const granoRef = useRef<Pattern | null>(null);
  const multiplicadorRef = useRef(1);

  const fuente = mismoOrigen(src);
  const def = PLANTILLAS.find((p) => p.id === plantilla)!;

  // Monta el canvas: fuentes cargadas de verdad (si no, el primer trazo sale con la
  // fuente del sistema), foto de fondo y textura de grano.
  useEffect(() => {
    if (!open || !el) return;

    let cancelado = false;

    (async () => {
      try {
        setError(null);
        await Promise.all([
          esperarFuente(`600 64px ${fraunces.style.fontFamily}`),
          esperarFuente(`400 28px ${inter.style.fontFamily}`),
        ]);
        const [img, grano] = await Promise.all([
          FabricImage.fromURL(fuente, { crossOrigin: "anonymous" }),
          cargarImagen(GRANO_SVG),
        ]);
        if (cancelado) return;

        const natW = img.width;
        const natH = img.height;
        const escala = Math.min(1, LADO_DISENO / Math.max(natW, natH));
        const W = Math.round(natW * escala);
        const H = Math.round(natH * escala);
        // La exportación no pasa de `MAX_LADO` ni agranda más allá del original.
        multiplicadorRef.current = Math.min(MAX_LADO, Math.max(natW, natH)) / Math.max(W, H);

        const canvas = new Canvas(el, {
          width: W,
          height: H,
          enableRetinaScaling: false,
          selection: false,
          preserveObjectStacking: true,
          backgroundColor: "#000",
        });
        const caja = cajaVista();
        const vista = Math.min(caja.ancho / W, caja.alto / H);
        canvas.setDimensions(
          { width: `${Math.round(W * vista)}px`, height: `${Math.round(H * vista)}px` },
          { cssOnly: true }
        );
        setAltoVista(Math.round(H * vista));

        img.set({ left: 0, top: 0, originX: "left", originY: "top", scaleX: W / natW, scaleY: H / natH });
        canvas.backgroundImage = img;

        // Cada texto solo se arrastra dentro de la zona segura de su plantilla.
        canvas.on("object:moving", (e) => {
          const comp = compRef.current;
          const obj = e.target as FabricObject | undefined;
          if (!comp || !obj) return;
          const zona = comp.zonas.get(obj);
          if (!zona) return;
          obj.set({
            left: acotar(obj.left, zona.left, zona.left + zona.width - obj.getScaledWidth()),
            top: acotar(obj.top, zona.top, zona.top + zona.height - obj.getScaledHeight()),
          });
          if (comp.subtitulo === obj) comp.subtituloMovido = true;
          if (comp.badge?.texto === obj) ajustarCajaBadge(comp);
        });

        granoRef.current = new Pattern({ source: grano, repeat: "repeat" });
        canvasRef.current = canvas;
        setListo(true);
      } catch (e) {
        if (!cancelado) setError(e instanceof Error ? e.message : "No se pudo abrir el editor.");
      }
    })();

    return () => {
      cancelado = true;
      compRef.current = null;
      granoRef.current = null;
      canvasRef.current?.dispose();
      canvasRef.current = null;
      setListo(false);
    };
  }, [open, fuente, el]);

  // Cambiar de plantilla rearma las capas y devuelve las posiciones a su sitio; el texto
  // ya escrito se conserva. Escribir solo actualiza los objetos que ya existen.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!listo || !canvas || !granoRef.current) return;

    let comp = compRef.current;
    if (comp?.id !== plantilla) {
      canvas.remove(...canvas.getObjects());
      comp = construirPlantilla(plantilla, canvas.width, canvas.height, granoRef.current, {
        display: fraunces.style.fontFamily,
        cuerpo: inter.style.fontFamily,
      });
      comp.objetos.forEach((o) => canvas.add(o));
      compRef.current = comp;
    }
    sincronizarTextos(comp, { headline, subtitulo, badge });
    canvas.requestRenderAll();
  }, [listo, plantilla, headline, subtitulo, badge]);

  async function aplicar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setProcesando(true);
    setError(null);
    try {
      canvas.discardActiveObject();
      canvas.renderAll();
      const plano = canvas.toCanvasElement(multiplicadorRef.current);
      const blob = await new Promise<Blob>((resolve, reject) => {
        try {
          plano.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("No se pudo generar la imagen con el texto."))),
            "image/jpeg",
            0.92
          );
        } catch {
          // Tainted canvas: la foto vino de otro origen sin permiso de lectura.
          reject(new Error("Esta imagen no se puede editar desde el navegador por su origen."));
        }
      });
      await onAplicar(new File([blob], `texto-${Date.now()}.jpg`, { type: "image/jpeg" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo aplicar el texto.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar texto"
      maxWidth={620}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={procesando} className="crm-btn crm-btn-sm crm-btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={aplicar}
            disabled={procesando || !listo || !headline.trim()}
            className="crm-btn crm-btn-sm crm-btn-primary"
          >
            {procesando ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Type className="size-3.5" strokeWidth={2} />
            )}
            Aplicar texto
          </button>
        </div>
      }
    >
      <div role="radiogroup" aria-label="Plantilla" className="mb-3 flex flex-wrap gap-2">
        {PLANTILLAS.map((p) => (
          <label
            key={p.id}
            className="crm-tab cursor-pointer focus-within:ring-2 focus-within:ring-[var(--crm-accent-ring)]"
            data-active={plantilla === p.id}
          >
            <input
              type="radio"
              name="plantilla"
              value={p.id}
              checked={plantilla === p.id}
              onChange={() => setPlantilla(p.id)}
              className="sr-only"
            />
            {p.label}
          </label>
        ))}
      </div>

      <div
        className="relative flex items-center justify-center rounded-lg border border-[var(--crm-line)] p-3"
        style={{ background: "var(--crm-surface)", minHeight: altoVista + 24 }}
      >
        <canvas ref={setEl} className="rounded-[3px]" />
        {!listo && !error && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-[var(--crm-ink-mute)]">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Preparando el editor…
          </div>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="ov-headline">
            Título
          </label>
          <input
            id="ov-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={80}
            className="crm-input"
            placeholder="Terrenos en la selva de Yucatán"
          />
        </div>
        {def.usaSubtitulo && (
          <div>
            <label className={labelCls} htmlFor="ov-subtitulo">
              Subtítulo (opcional)
            </label>
            <input
              id="ov-subtitulo"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              maxLength={110}
              className="crm-input"
              placeholder="A 20 minutos de Mérida"
            />
          </div>
        )}
        {def.usaBadge && (
          <div>
            <label className={labelCls} htmlFor="ov-badge">
              Etiqueta (opcional)
            </label>
            <input
              id="ov-badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              maxLength={22}
              className="crm-input"
              placeholder="Preventa"
            />
          </div>
        )}
      </div>

      <p className="mt-2.5 text-[12px] leading-snug text-[var(--crm-ink-mute)]">
        Arrastra el texto para acomodarlo: solo se mueve dentro de la zona de la plantilla. Cambiar de plantilla
        conserva lo escrito y reacomoda las posiciones. Se guarda un JPEG aplanado de máximo{" "}
        <span className="crm-num">{MAX_LADO}</span> px de lado, sin la foto original.
      </p>

      {error && (
        <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </Modal>
  );
}

function acotar(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(valor, Math.max(min, max)));
}

// Una fuente que no carga no debe tumbar el editor: se dibuja con la de respaldo.
async function esperarFuente(shorthand: string) {
  try {
    await document.fonts.load(shorthand);
    await document.fonts.ready;
  } catch {
    /* sigue con la de respaldo del sistema */
  }
}
