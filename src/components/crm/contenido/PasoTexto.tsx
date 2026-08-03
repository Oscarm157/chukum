"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Pattern, type FabricObject, type Group } from "fabric";
import { Loader2, Type } from "lucide-react";
import { fraunces, inter } from "@/lib/contenido/fonts";
import { cargarPerfilFirma, type PerfilFirma } from "@/app/admin/(panel)/contenido/perfil-actions";
import { MAX_LADO, mismoOrigen, cargarImagen } from "@/components/crm/contenido/imagen";
import {
  construirPlantilla,
  construirFirma,
  sincronizarTextos,
  ajustarCajaBadge,
  GRANO_SVG,
  PLANTILLAS,
  type Composicion,
  type PlantillaId,
  type Zona,
} from "@/components/crm/contenido/plantillas";

/**
 * Paso de overlay de texto del `ImageWorkspace`: se elige plantilla, se escribe el texto y
 * se arrastra dentro de la zona segura. Al aplicar exporta un JPEG aplanado que pasa a ser
 * la imagen de trabajo; la "receta" (plantilla, texto, posición) no se guarda.
 */

// Resolución de trabajo del canvas. La exportación sube a `MAX_LADO` con el multiplicador
// de fabric, así que dibujar aquí a 1080 mantiene el editor fluido sin perder calidad.
const LADO_DISENO = 1080;
// Caja donde se muestra el canvas dentro del modal. En pantalla angosta se achica para
// que los campos de texto no queden abajo del pliegue.
function cajaVista() {
  const angosta = window.innerWidth < 640;
  return { ancho: Math.min(520, window.innerWidth - 96), alto: angosta ? 240 : 320 };
}

const labelCls = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";

export function PasoTexto({
  src,
  onAplicar,
  onBusy,
}: {
  /** Imagen de trabajo actual: object URL local o URL ya persistida. */
  src: string;
  onAplicar: (file: File) => void | Promise<void>;
  onBusy: (busy: boolean) => void;
}) {
  const [plantilla, setPlantilla] = useState<PlantillaId>("banda");
  const [headline, setHeadline] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [badge, setBadge] = useState("");
  const [perfil, setPerfil] = useState<PerfilFirma | null>(null);
  const [conFirma, setConFirma] = useState(false);
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
  // La firma vive fuera de la composición: sobrevive al cambio de plantilla.
  const firmaRef = useRef<Group | null>(null);
  const zonaFirmaRef = useRef<Zona | null>(null);

  const fuente = mismoOrigen(src);
  const def = PLANTILLAS.find((p) => p.id === plantilla)!;

  // Sin perfil guardado no hay firma que ofrecer: la casilla ni se pinta.
  useEffect(() => {
    let cancelado = false;
    cargarPerfilFirma()
      .then((p) => {
        if (!cancelado) setPerfil(p);
      })
      .catch(() => {
        /* el editor sirve igual sin firma */
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Monta el canvas: fuentes cargadas de verdad (si no, el primer trazo sale con la
  // fuente del sistema), foto de fondo y textura de grano. Si la imagen de trabajo cambia
  // (por ejemplo, se recortó primero), se rearma sobre la nueva.
  useEffect(() => {
    if (!el) return;

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
      firmaRef.current = null;
      zonaFirmaRef.current = null;
      canvasRef.current?.dispose();
      canvasRef.current = null;
      setListo(false);
    };
  }, [fuente, el]);

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
      // La firma se quitó junto con la plantilla anterior: vuelve encima, en la misma
      // posición a la que se hubiera arrastrado.
      if (firmaRef.current && zonaFirmaRef.current) {
        canvas.add(firmaRef.current);
        comp.zonas.set(firmaRef.current, zonaFirmaRef.current);
      }
      compRef.current = comp;
    }
    sincronizarTextos(comp, { headline, subtitulo, badge });
    canvas.requestRenderAll();
  }, [listo, plantilla, headline, subtitulo, badge]);

  // Capa de firma: se agrega y se quita del canvas de verdad, no se oculta, para que no
  // pueda colarse en la exportación.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!listo || !canvas) return;

    if (!conFirma || !perfil) {
      if (firmaRef.current) {
        canvas.remove(firmaRef.current);
        compRef.current?.zonas.delete(firmaRef.current);
        firmaRef.current = null;
        zonaFirmaRef.current = null;
        canvas.requestRenderAll();
      }
      return;
    }
    if (firmaRef.current) return;

    let cancelado = false;
    (async () => {
      // Una foto que no carga (o que viene de un origen sin CORS) no debe tumbar la firma:
      // sale solo con el texto.
      const foto = perfil.photoUrl
        ? await cargarImagen(mismoOrigen(perfil.photoUrl)).catch(() => null)
        : null;
      const comp = compRef.current;
      if (cancelado || !comp || canvasRef.current !== canvas) return;

      const firma = construirFirma(canvas.width, canvas.height, perfil, {
        display: fraunces.style.fontFamily,
        cuerpo: inter.style.fontFamily,
      }, foto);
      canvas.add(firma.grupo);
      comp.zonas.set(firma.grupo, firma.zona);
      firmaRef.current = firma.grupo;
      zonaFirmaRef.current = firma.zona;
      canvas.requestRenderAll();
    })();

    return () => {
      cancelado = true;
    };
  }, [listo, conFirma, perfil]);

  async function aplicar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setProcesando(true);
    onBusy(true);
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
      onBusy(false);
    }
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Plantilla" className="mb-3 flex gap-2 overflow-x-auto sm:flex-wrap">
        {PLANTILLAS.map((p) => (
          <label
            key={p.id}
            className="crm-tab shrink-0 cursor-pointer focus-within:ring-2 focus-within:ring-[var(--crm-accent-ring)]"
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

      {perfil && (
        <label className="mt-3 flex items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
          <input
            type="checkbox"
            checked={conFirma}
            onChange={(e) => setConFirma(e.target.checked)}
            className="h-4 w-4 accent-[var(--crm-accent-strong)]"
          />
          Incluir mi firma
          <span className="text-[12px] text-[var(--crm-ink-faint)]">
            {perfil.name}
            {perfil.phone ? ` · ${perfil.phone}` : ""}
          </span>
        </label>
      )}

      {/* Pegada al borde inferior del cuerpo del modal: la acción del paso no se pierde
          abajo del scroll cuando el contenido es alto. */}
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--crm-line)] bg-[var(--crm-surface-2)] px-6 py-2.5 sm:justify-between">
        <p className="hidden max-w-[52ch] text-[12px] leading-snug text-[var(--crm-ink-mute)] sm:block">
          El texto se arrastra dentro de la zona de la plantilla. Sale un JPEG aplanado de máximo{" "}
          <span className="crm-num">{MAX_LADO}</span> px de lado.
        </p>
        <button
          type="button"
          onClick={aplicar}
          disabled={procesando || !listo || !headline.trim()}
          className="crm-btn crm-btn-sm crm-btn-secondary"
        >
          {procesando ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Type className="size-3.5" strokeWidth={2} />
          )}
          Aplicar texto
        </button>
      </div>

      {error && (
        <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </div>
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
