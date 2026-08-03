"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Pattern, type FabricObject, type Group } from "fabric";
import { Loader2, Type } from "lucide-react";
import { fraunces, inter } from "@/lib/contenido/fonts";
import { cargarPerfilFirma, type PerfilFirma } from "@/app/admin/(panel)/contenido/perfil-actions";
import { MAX_LADO, mismoOrigen, cargarImagen } from "@/components/crm/contenido/imagen";
import { PasoLayout, controlLabel } from "@/components/crm/contenido/PasoLayout";
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
 *
 * La plantilla y los campos viven en la columna de controles; el canvas se queda con el
 * lienzo y se dimensiona al hueco real que le deja esa columna.
 */

// Resolución de trabajo del canvas. La exportación sube a `MAX_LADO` con el multiplicador
// de fabric, así que dibujar aquí a 1080 mantiene el editor fluido sin perder calidad.
const LADO_DISENO = 1080;
// Padding de la caja del lienzo (`p-3`), a descontar del hueco disponible.
const AIRE_CAJA = 24;

// El canvas se muestra al tamaño que quepa en su caja, sin deformar: la resolución de
// trabajo (W×H) no cambia, solo su tamaño en CSS.
function ajustarVista(canvas: Canvas, W: number, H: number, caja: HTMLElement) {
  const ancho = Math.max(160, caja.clientWidth - AIRE_CAJA);
  const alto = Math.max(160, caja.clientHeight - AIRE_CAJA);
  const vista = Math.min(ancho / W, alto / H);
  canvas.setDimensions(
    { width: `${Math.round(W * vista)}px`, height: `${Math.round(H * vista)}px` },
    { cssOnly: true }
  );
}

export function PasoTexto({
  src,
  pestanas,
  onAplicar,
  onBusy,
}: {
  /** Imagen de trabajo actual: object URL local o URL ya persistida. */
  src: string;
  /** Selector de paso del workspace; se pinta arriba de la columna de controles. */
  pestanas: React.ReactNode;
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
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El editor monta su contenido en un portal después del primer render: con un ref normal
  // el efecto correría antes de que exista el <canvas>. Con estado se dispara al montarlo.
  const [el, setEl] = useState<HTMLCanvasElement | null>(null);
  // La caja que le da su tamaño al canvas: se mide, no se supone.
  const [caja, setCaja] = useState<HTMLDivElement | null>(null);
  const disenoRef = useRef({ W: 0, H: 0 });
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
    if (!el || !caja) return;

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
        disenoRef.current = { W, H };
        ajustarVista(canvas, W, H, caja);

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
  }, [fuente, el, caja]);

  // Al cambiar el tamaño de la ventana (o al pasar de una columna a dos), el canvas se
  // vuelve a acomodar al hueco nuevo sin rearmar la composición.
  useEffect(() => {
    if (!listo || !caja) return;
    const observador = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) ajustarVista(canvas, disenoRef.current.W, disenoRef.current.H, caja);
    });
    observador.observe(caja);
    return () => observador.disconnect();
  }, [listo, caja]);

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
    <PasoLayout
      pestanas={pestanas}
      error={error}
      controles={
        <>
          <div role="radiogroup" aria-label="Plantilla">
            <span className={controlLabel}>Plantilla</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PLANTILLAS.map((p) => (
                <label
                  key={p.id}
                  className="crm-tab flex cursor-pointer justify-center text-center leading-tight focus-within:ring-2 focus-within:ring-[var(--crm-accent-ring)]"
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
          </div>

          <div className="mt-5 grid gap-3">
            <div>
              <label className={controlLabel} htmlFor="ov-headline">
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
                <label className={controlLabel} htmlFor="ov-subtitulo">
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
                <label className={controlLabel} htmlFor="ov-badge">
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
            <label className="mt-4 flex items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
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

          <p className="mt-4 text-[12px] leading-snug text-[var(--crm-ink-mute)]">
            El texto se arrastra dentro de la zona de la plantilla. Sale un JPEG aplanado de máximo{" "}
            <span className="crm-num">{MAX_LADO}</span> px de lado.
          </p>
        </>
      }
      acciones={
        <button
          type="button"
          onClick={aplicar}
          disabled={procesando || !listo || !headline.trim()}
          className="crm-btn crm-btn-sm crm-btn-secondary w-full"
        >
          {procesando ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Type className="size-3.5" strokeWidth={2} />
          )}
          Aplicar texto
        </button>
      }
      lienzo={
        <div
          ref={setCaja}
          className="relative flex h-[320px] w-full items-center justify-center rounded-lg border border-[var(--crm-line)] p-3 sm:h-[400px] lg:h-auto lg:min-h-0 lg:flex-1"
          style={{ background: "var(--crm-surface)" }}
        >
          <canvas ref={setEl} className="rounded-[3px]" />
          {!listo && !error && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-[var(--crm-ink-mute)]">
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Preparando el editor…
            </div>
          )}
        </div>
      }
    />
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
