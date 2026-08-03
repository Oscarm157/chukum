import { Rect, Textbox, FabricText, FabricImage, Circle, Group, type Pattern, type FabricObject } from "fabric";

/**
 * Las seis plantillas de overlay del sistema de diseño de Chukum (DESIGN-chukum.md), más
 * la firma del vendedor, que es una capa aparte y se puede sumar a cualquiera de ellas.
 * Todas pintan bloques opacos ENCIMA de la foto: ninguna la reencuadra ni la mueve.
 * Las medidas van en proporción del canvas, así una plantilla se ve igual en 1:1,
 * 4:5 o 9:16.
 */

const COLOR = {
  espresso: "#1E1A16",
  crema: "#F2E7D6",
  chukum: "#B9A489",
  cenote: "#2E7D6B",
  ink: "#241E17",
  ink2: "#6E6353",
} as const;

// Mismo ruido de `.chukum-grain` en globals.css, servido como imagen para el patrón.
export const GRANO_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.28'/%3E%3C/svg%3E";

export type PlantillaId =
  | "banda"
  | "banda_superior"
  | "badge"
  | "franja"
  | "franja_derecha"
  | "marco";

export const PLANTILLAS: { id: PlantillaId; label: string; usaBadge: boolean; usaSubtitulo: boolean }[] = [
  { id: "banda", label: "Banda inferior", usaBadge: false, usaSubtitulo: true },
  { id: "banda_superior", label: "Banda superior", usaBadge: false, usaSubtitulo: true },
  { id: "badge", label: "Badge y centro", usaBadge: true, usaSubtitulo: false },
  { id: "franja", label: "Franja lateral", usaBadge: false, usaSubtitulo: true },
  { id: "franja_derecha", label: "Franja lateral (derecha)", usaBadge: false, usaSubtitulo: true },
  { id: "marco", label: "Marco", usaBadge: false, usaSubtitulo: true },
];

export type Textos = { headline: string; subtitulo: string; badge: string };

export type Zona = { left: number; top: number; width: number; height: number };

export type Composicion = {
  id: PlantillaId;
  objetos: FabricObject[];
  headline: Textbox;
  subtitulo: Textbox | null;
  badge: { texto: FabricText; caja: Rect; padX: number; alto: number } | null;
  zonas: Map<FabricObject, Zona>;
  /** Separación por defecto entre título y subtítulo. */
  gap: number;
  /** Al arrastrarlo a mano deja de reacomodarse solo bajo el título. */
  subtituloMovido: boolean;
};

type Fuentes = { display: string; cuerpo: string };

// fabric v7 ancla los objetos por su centro; aquí todo se posiciona por la esquina
// superior izquierda, que es como están escritas las medidas de las plantillas.
const ESQUINA = { originX: "left", originY: "top" } as const;

// Los bloques de fondo son decoración: no se seleccionan ni reciben clics.
const ESTATICO = {
  ...ESQUINA,
  selectable: false,
  evented: false,
  objectCaching: false,
  hoverCursor: "default",
} as const;

// Los textos solo se mueven: el tamaño y la rotación los fija la plantilla.
const MOVIBLE = {
  ...ESQUINA,
  selectable: true,
  evented: true,
  objectCaching: false,
  hasControls: false,
  lockRotation: true,
  lockScalingX: true,
  lockScalingY: true,
  hoverCursor: "move",
  moveCursor: "grabbing",
  borderColor: COLOR.cenote,
  // El canvas se dibuja a resolución de exportación y se muestra reducido: el borde de
  // selección se define en unidades del diseño para que se vea de ~2px en pantalla.
  borderScaleFactor: 6,
  padding: 10,
} as const;

export function construirPlantilla(
  id: PlantillaId,
  ancho: number,
  alto: number,
  grano: Pattern,
  fuentes: Fuentes
): Composicion {
  if (id === "banda" || id === "banda_superior") return banda(id, ancho, alto, grano, fuentes);
  if (id === "franja" || id === "franja_derecha") return franja(id, ancho, alto, grano, fuentes);
  if (id === "marco") return marco(ancho, alto, fuentes);
  return badge(ancho, alto, fuentes);
}

// 1. Banda espresso con el titular en crema, abajo o arriba. Las dos variantes comparten
// medidas: solo cambia el borde del que se cuelga la banda.
function banda(
  id: "banda" | "banda_superior",
  W: number,
  H: number,
  grano: Pattern,
  fuentes: Fuentes
): Composicion {
  const pad = 0.05 * W;
  const altoBanda = 0.38 * H;
  const top = id === "banda" ? H - altoBanda : 0;
  const cuerpoFuente = 0.065 * W;

  const fondo = new Rect({ left: 0, top, width: W, height: altoBanda, fill: COLOR.espresso, opacity: 0.92, ...ESTATICO });
  const textura = new Rect({
    left: 0,
    top,
    width: W,
    height: altoBanda,
    fill: grano,
    opacity: 0.5,
    // Mismo tratamiento que `.chukum-grain::after` en globals.css.
    globalCompositeOperation: "multiply",
    ...ESTATICO,
  });

  const headline = new Textbox("", {
    left: pad,
    top: top + 0.2 * altoBanda,
    width: W - 2 * pad,
    fontSize: cuerpoFuente,
    fontFamily: fuentes.display,
    fontWeight: 600,
    fill: COLOR.crema,
    lineHeight: 1.05,
    textAlign: "left",
    ...MOVIBLE,
  });

  const subtitulo = new Textbox("", {
    left: pad,
    top: top + 0.2 * altoBanda + cuerpoFuente * 1.35,
    width: W - 2 * pad,
    fontSize: cuerpoFuente * 0.4,
    fontFamily: fuentes.cuerpo,
    fill: COLOR.crema,
    opacity: 0.78,
    lineHeight: 1.35,
    textAlign: "left",
    ...MOVIBLE,
  });

  const zona: Zona = { left: pad, top: top + pad * 0.7, width: W - 2 * pad, height: altoBanda - pad * 1.4 };

  return {
    id,
    objetos: [fondo, textura, headline, subtitulo],
    headline,
    subtitulo,
    badge: null,
    zonas: new Map<FabricObject, Zona>([
      [headline, zona],
      [subtitulo, zona],
    ]),
    gap: 0.018 * H,
    subtituloMovido: false,
  };
}

// 2. Etiqueta cenote arriba y titular centrado sobre un velo, para fotos con mucho detalle.
function badge(W: number, H: number, fuentes: Fuentes): Composicion {
  const pad = 0.05 * W;
  const altoBadge = 0.06 * H;
  const padX = 0.025 * W;

  const cajaBadge = new Rect({
    left: 0.05 * W,
    top: 0.05 * H,
    width: altoBadge * 2,
    height: altoBadge,
    rx: altoBadge * 0.26,
    ry: altoBadge * 0.26,
    fill: COLOR.cenote,
    ...ESTATICO,
  });

  const textoBadge = new FabricText("", {
    left: 0.05 * W + padX,
    top: 0.05 * H,
    fontSize: 0.022 * W,
    fontFamily: fuentes.cuerpo,
    fontWeight: 500,
    fill: COLOR.crema,
    charSpacing: 90,
    ...MOVIBLE,
  });

  const velo = new Rect({
    left: 0,
    top: H / 3,
    width: W,
    height: H / 3,
    fill: "rgba(0,0,0,0.35)",
    ...ESTATICO,
  });

  const headline = new Textbox("", {
    left: pad,
    top: H / 3 + 0.06 * H,
    width: W - 2 * pad,
    fontSize: 0.07 * W,
    fontFamily: fuentes.display,
    fontWeight: 600,
    fill: COLOR.crema,
    lineHeight: 1.08,
    textAlign: "center",
    ...MOVIBLE,
  });

  const zonaBadge: Zona = { left: 0.04 * W, top: 0.04 * H, width: 0.46 * W, height: 0.26 * H };
  const zonaHeadline: Zona = { left: pad, top: H / 3 + 0.03 * H, width: W - 2 * pad, height: H / 3 - 0.06 * H };

  return {
    id: "badge",
    objetos: [velo, cajaBadge, textoBadge, headline],
    headline,
    subtitulo: null,
    badge: { texto: textoBadge, caja: cajaBadge, padX, alto: altoBadge },
    zonas: new Map<FabricObject, Zona>([
      [headline, zonaHeadline],
      // El texto se mueve dentro de la esquina menos el margen que ocupa su caja.
      [
        textoBadge,
        {
          left: zonaBadge.left + padX,
          top: zonaBadge.top + altoBadge * 0.2,
          width: zonaBadge.width - 2 * padX,
          height: zonaBadge.height - altoBadge,
        },
      ],
    ]),
    gap: 0,
    subtituloMovido: false,
  };
}

// 3. Franja lateral de estuco: el titular va en tinta oscura sobre superficie clara. El
// texto se alinea a la izquierda de la franja, no del canvas, así que la variante derecha
// solo desplaza el bloque completo.
function franja(
  id: "franja" | "franja_derecha",
  W: number,
  H: number,
  grano: Pattern,
  fuentes: Fuentes
): Composicion {
  const anchoFranja = 0.35 * W;
  const pad = 0.04 * W;
  const cuerpoFuente = 0.06 * W;
  const left = id === "franja" ? 0 : W - anchoFranja;

  const fondo = new Rect({ left, top: 0, width: anchoFranja, height: H, fill: COLOR.chukum, ...ESTATICO });
  const textura = new Rect({
    left,
    top: 0,
    width: anchoFranja,
    height: H,
    fill: grano,
    opacity: 0.5,
    globalCompositeOperation: "multiply",
    ...ESTATICO,
  });

  const headline = new Textbox("", {
    left: left + pad,
    top: 0.12 * H,
    width: anchoFranja - 2 * pad,
    fontSize: cuerpoFuente,
    fontFamily: fuentes.display,
    fontWeight: 600,
    fill: COLOR.ink,
    lineHeight: 1.05,
    textAlign: "left",
    ...MOVIBLE,
  });

  const subtitulo = new Textbox("", {
    left: left + pad,
    top: 0.12 * H + cuerpoFuente * 1.4,
    width: anchoFranja - 2 * pad,
    fontSize: cuerpoFuente * 0.4,
    fontFamily: fuentes.cuerpo,
    fill: COLOR.ink2,
    lineHeight: 1.35,
    textAlign: "left",
    ...MOVIBLE,
  });

  const zona: Zona = { left: left + pad, top: pad, width: anchoFranja - 2 * pad, height: H - 2 * pad };

  return {
    id,
    objetos: [fondo, textura, headline, subtitulo],
    headline,
    subtitulo,
    badge: null,
    zonas: new Map<FabricObject, Zona>([
      [headline, zona],
      [subtitulo, zona],
    ]),
    gap: 0.018 * H,
    subtituloMovido: false,
  };
}

// 4. Marco fino de crema y caja de texto en la esquina inferior derecha. Es la plantilla
// minimal: sin grano y sin badge, la foto se ve casi entera.
function marco(W: number, H: number, fuentes: Fuentes): Composicion {
  const grosor = 0.015 * W;
  // El marco va despegado del borde: pegado se leería como el borde del archivo, no como
  // un marco puesto encima de la foto.
  const inset = 0.03 * W;
  const cajaW = 0.4 * W;
  const cajaH = 0.16 * H;
  const padCaja = 0.028 * W;
  const cuerpoFuente = 0.042 * W;

  // Un solo Rect sin relleno: fabric centra el trazo sobre el contorno, así que el rect se
  // dibuja medio grosor hacia adentro para que el marco caiga completo dentro de la foto.
  const borde = new Rect({
    left: inset + grosor / 2,
    top: inset + grosor / 2,
    width: W - 2 * inset - grosor,
    height: H - 2 * inset - grosor,
    fill: "transparent",
    stroke: COLOR.crema,
    strokeWidth: grosor,
    ...ESTATICO,
  });

  const cajaLeft = W - inset - grosor - padCaja - cajaW;
  const cajaTop = H - inset - grosor - padCaja - cajaH;

  const caja = new Rect({
    left: cajaLeft,
    top: cajaTop,
    width: cajaW,
    height: cajaH,
    fill: COLOR.espresso,
    opacity: 0.92,
    ...ESTATICO,
  });

  const headline = new Textbox("", {
    left: cajaLeft + padCaja,
    top: cajaTop + 0.2 * cajaH,
    width: cajaW - 2 * padCaja,
    fontSize: cuerpoFuente,
    fontFamily: fuentes.display,
    fontWeight: 600,
    fill: COLOR.crema,
    lineHeight: 1.05,
    textAlign: "right",
    ...MOVIBLE,
  });

  const subtitulo = new Textbox("", {
    left: cajaLeft + padCaja,
    top: cajaTop + 0.2 * cajaH + cuerpoFuente * 1.35,
    width: cajaW - 2 * padCaja,
    fontSize: cuerpoFuente * 0.45,
    fontFamily: fuentes.cuerpo,
    fill: COLOR.crema,
    opacity: 0.78,
    lineHeight: 1.35,
    textAlign: "right",
    ...MOVIBLE,
  });

  // La caja es angosta: el texto solo sube y baja dentro de ella, no se desalinea del
  // borde derecho.
  const zona: Zona = {
    left: cajaLeft + padCaja,
    top: cajaTop + padCaja * 0.5,
    width: cajaW - 2 * padCaja,
    height: cajaH - padCaja,
  };

  return {
    id: "marco",
    objetos: [borde, caja, headline, subtitulo],
    headline,
    subtitulo,
    badge: null,
    zonas: new Map<FabricObject, Zona>([
      [headline, zona],
      [subtitulo, zona],
    ]),
    gap: 0.012 * H,
    subtituloMovido: false,
  };
}

/**
 * Firma del vendedor: capa opcional, independiente de la plantilla. Va siempre en la
 * esquina superior derecha, la única que ninguna de las seis plantillas ocupa (la banda
 * inferior, la franja izquierda y el badge superior izquierdo quedan libres). Se mueve en
 * bloque: foto, nombre y teléfono no se arrastran por separado.
 */
export type Firma = { grupo: Group; zona: Zona };

export function construirFirma(
  W: number,
  H: number,
  perfil: { name: string; phone: string | null },
  fuentes: Fuentes,
  foto: HTMLImageElement | null
): Firma {
  const margen = 0.04 * W;
  const padCaja = 0.018 * W;
  const diametro = 0.08 * W;
  const gapFoto = 0.016 * W;
  const gapTexto = 0.008 * W;

  const nombre = new FabricText(perfil.name, {
    fontSize: 0.023 * W,
    fontFamily: fuentes.cuerpo,
    fontWeight: 500,
    fill: COLOR.crema,
    ...ESQUINA,
    objectCaching: false,
  });
  const telTexto = perfil.phone?.trim() ?? "";
  const telefono = telTexto
    ? new FabricText(telTexto, {
        fontSize: 0.019 * W,
        fontFamily: fuentes.cuerpo,
        fill: COLOR.crema,
        opacity: 0.78,
        ...ESQUINA,
        objectCaching: false,
      })
    : null;

  const imagen = foto ? fotoCircular(foto, diametro) : null;
  const anchoTexto = Math.max(nombre.width, telefono?.width ?? 0);
  const altoTexto = nombre.height + (telefono ? gapTexto + telefono.height : 0);
  const anchoCaja = 2 * padCaja + (imagen ? diametro + gapFoto : 0) + anchoTexto;
  const altoCaja = 2 * padCaja + Math.max(imagen ? diametro : 0, altoTexto);
  const left = W - margen - anchoCaja;
  const top = margen;
  const centro = top + altoCaja / 2;

  // Mismo velo que usa la plantilla `badge`: sin él, un nombre en crema se pierde sobre
  // una foto clara.
  const velo = new Rect({
    left,
    top,
    width: anchoCaja,
    height: altoCaja,
    rx: altoCaja * 0.26,
    ry: altoCaja * 0.26,
    fill: "rgba(0,0,0,0.35)",
    ...ESTATICO,
  });

  const xTexto = left + padCaja + (imagen ? diametro + gapFoto : 0);
  imagen?.set({ left: left + padCaja, top: centro - diametro / 2 });
  nombre.set({ left: xTexto, top: centro - altoTexto / 2 });
  telefono?.set({ left: xTexto, top: centro - altoTexto / 2 + nombre.height + gapTexto });

  const grupo = new Group(
    [velo, ...(imagen ? [imagen] : []), nombre, ...(telefono ? [telefono] : [])],
    MOVIBLE
  );
  // El grupo recalcula su propia caja al armarse: se reafirma la esquina para que `left`
  // y `top` sigan siendo los de la composición.
  grupo.set({ left, top });
  grupo.setCoords();

  return {
    grupo,
    // Se mueve por la mitad superior derecha del lienzo, nunca sobre la banda inferior ni
    // sobre el badge de la esquina contraria.
    zona: { left: W / 2, top: 0.025 * H, width: W / 2 - 0.025 * W, height: 0.32 * H },
  };
}

// Recorta la foto al cuadrado central y la enmascara con un círculo. El clipPath vive en
// las unidades naturales de la imagen, antes de escalarla al diámetro final.
function fotoCircular(foto: HTMLImageElement, diametro: number): FabricImage {
  const lado = Math.min(foto.naturalWidth, foto.naturalHeight);
  return new FabricImage(foto, {
    ...ESQUINA,
    cropX: (foto.naturalWidth - lado) / 2,
    cropY: (foto.naturalHeight - lado) / 2,
    width: lado,
    height: lado,
    scaleX: diametro / lado,
    scaleY: diametro / lado,
    clipPath: new Circle({ radius: lado / 2, originX: "center", originY: "center" }),
    objectCaching: false,
  });
}

/** Vuelca lo que Oscar escribió en los campos sobre los objetos del canvas. */
export function sincronizarTextos(comp: Composicion, textos: Textos) {
  const conTitular = textos.headline.trim();
  comp.headline.set({ text: conTitular, visible: conTitular.length > 0 });
  comp.headline.initDimensions();

  if (comp.subtitulo) {
    const sub = textos.subtitulo.trim();
    comp.subtitulo.set({ text: sub, visible: sub.length > 0 });
    comp.subtitulo.initDimensions();
    // Mientras no se arrastre a mano, el subtítulo sigue al titular: si el titular crece
    // a dos líneas, el subtítulo baja en vez de quedar encima.
    if (!comp.subtituloMovido) {
      comp.subtitulo.set({ top: comp.headline.top + comp.headline.height + comp.gap });
    }
    comp.subtitulo.setCoords();
  }

  if (comp.badge) {
    const etiqueta = textos.badge.trim().toUpperCase();
    comp.badge.texto.set({ text: etiqueta, visible: etiqueta.length > 0 });
    comp.badge.texto.initDimensions();
    comp.badge.caja.set({ visible: etiqueta.length > 0 });
    ajustarCajaBadge(comp);
  }

  comp.headline.setCoords();
}

/** La caja del badge no se arrastra: se recalcula alrededor de su texto. */
export function ajustarCajaBadge(comp: Composicion) {
  if (!comp.badge) return;
  const { texto, caja, padX, alto } = comp.badge;
  caja.set({
    left: texto.left - padX,
    top: texto.top - (alto - texto.height) / 2,
    width: texto.width + 2 * padX,
  });
  caja.setCoords();
}
