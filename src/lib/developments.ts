// Fuente única de los desarrollos que Chukum comercializa, para la home V2 (grid + quiz).
// Datos reales portados de la home anterior y del material de /campus. Client-safe: sin
// dependencias de servidor. NO inventar precios: el único monto real es el de Xo'ok; el
// resto es "disponibilidad y precios bajo solicitud" a propósito.

// Macro-zonas reales del catálogo (las cuatro que existen hoy).
export type Zona = "merida" | "costa" | "caribe" | "selva";
export type Tipo = "terreno" | "casa" | "departamento";
export type Uso = "invertir" | "vivir";
// Reusa las etiquetas de DevelopmentStatus del dominio (ver STATUS_LABEL en site.ts).
export type Etapa = "preventa" | "en_construccion" | "entrega_inmediata";

export type Development = {
  slug: string;
  // No se permite nombrar el proyecto en publicidad, así que el nombre real NO vive aquí
  // (ni siquiera en el bundle). El slug es el único id interno; las cards usan heading+tipo+etapa.
  heading: string; // encabezado de card por ubicación, sin nombre de proyecto
  place: string; // ubicación legible (uso interno / alt)
  ciudad: string; // ciudad para el filtro del catálogo (Xo'ok va como "Selva maya")
  zona: Zona;
  tipos: Tipo[];
  usos: Uso[];
  etapa: Etapa;
  image: string;
  alt: string;
  blurb: string; // descripción factual, sin adornos
  // Specs reales solo cuando existen (Xo'ok es el único con montos publicados).
  specs?: { label: string; value: string }[];
};

export const ZONA_LABEL: Record<Zona, string> = {
  merida: "Mérida ciudad",
  costa: "Costa de Yucatán",
  caribe: "Caribe, Quintana Roo",
  selva: "Selva maya",
};

export const TIPO_LABEL: Record<Tipo, string> = {
  terreno: "Terreno",
  casa: "Casa",
  departamento: "Departamento",
};

export const DEVELOPMENTS: Development[] = [
  {
    slug: "xook",
    heading: "En la selva de Yucatán",
    place: "Yucatán, selva maya",
    ciudad: "Selva maya",
    zona: "selva",
    tipos: ["terreno", "casa"],
    usos: ["invertir", "vivir"],
    etapa: "preventa",
    image: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club y alberca de un desarrollo residencial en la selva de Yucatán",
    blurb:
      "Desarrollo residencial en la selva, con siete etapas, casa club y amenidades entre cenotes y naturaleza.",
    specs: [
      { label: "Aparta con", value: "$10,000 MXN" },
      { label: "Enganche", value: "25%" },
      { label: "Etapas", value: "7" },
    ],
  },
  {
    slug: "ciudad-central-merida",
    heading: "En el norte de Mérida",
    place: "Mérida, Yucatán",
    ciudad: "Mérida",
    zona: "merida",
    tipos: ["terreno", "casa"],
    usos: ["invertir", "vivir"],
    etapa: "entrega_inmediata",
    image: "/hero/ccm-casa-club.webp",
    alt: "Casa club y alberca de una comunidad planeada en Mérida",
    blurb:
      "Comunidad planeada en Mérida con casa club, áreas verdes y zona comercial. Miles de unidades ya entregadas.",
  },
  {
    slug: "ciudad-central-progreso",
    heading: "Frente al mar en Progreso",
    place: "Progreso, Yucatán, frente al mar",
    ciudad: "Progreso",
    zona: "costa",
    tipos: ["terreno"],
    usos: ["invertir", "vivir"],
    etapa: "en_construccion",
    image: "/hero/club-playa-progreso.webp",
    alt: "Club de playa de una comunidad planeada frente al mar en Progreso",
    blurb:
      "Comunidad planeada frente al mar en la costa de Yucatán, con club de playa y amplias áreas comunes.",
  },
  {
    slug: "ukana-playa-del-carmen",
    heading: "Frente al mar en Playa del Carmen",
    place: "Playa del Carmen, Quintana Roo",
    ciudad: "Playa del Carmen",
    zona: "caribe",
    tipos: ["departamento"],
    usos: ["invertir", "vivir"],
    etapa: "entrega_inmediata",
    image: "/hero/ukana-pdc-alberca.webp",
    alt: "Alberca de un desarrollo de departamentos entregado en Playa del Carmen",
    blurb:
      "Departamentos en un desarrollo vertical ya entregado, con alberca y gimnasio, cerca de la playa.",
  },
  {
    slug: "tulum-ha",
    heading: "En Tulum, entre selva y playa",
    place: "Tulum, Quintana Roo",
    ciudad: "Tulum",
    zona: "caribe",
    tipos: ["departamento"],
    usos: ["invertir"],
    etapa: "en_construccion",
    image: "/hero/tulum-ha-avance.webp",
    alt: "Avance de obra de un desarrollo de departamentos en Tulum",
    blurb:
      "Departamentos en un desarrollo vertical en construcción, entre selva y playa.",
  },
];

// Etiqueta de tipos para la card (ej. "Terreno y casa"). Sin nombre de proyecto.
export function tiposLabel(tipos: Tipo[]): string {
  return tipos.map((t) => TIPO_LABEL[t]).join(" y ");
}

// Ciudades únicas de una lista de desarrollos (para los pills de filtro), en orden
// de aparición y sin repetir.
export function ciudadesDe(devs: Development[]): string[] {
  return [...new Set(devs.map((d) => d.ciudad))];
}

export type QuizAnswers = {
  uso: Uso;
  zona: Zona;
  tipo: Tipo;
  etapa: Etapa | "cualquiera";
};

// Empareja las respuestas del quiz con los desarrollos reales. Ponderado: la zona pesa
// más, luego el tipo de propiedad, luego uso y etapa. Devuelve hasta 3 rankeados y descarta
// los que no coinciden en nada (score 0), pero siempre deja al menos el mejor esfuerzo (#1).
export function matchDevelopments(devs: Development[], a: QuizAnswers): Development[] {
  const scored = devs.map((d) => {
    let score = 0;
    if (d.zona === a.zona) score += 3;
    if (d.tipos.includes(a.tipo)) score += 2;
    if (d.usos.includes(a.uso)) score += 1;
    if (a.etapa !== "cualquiera" && d.etapa === a.etapa) score += 1;
    return { d, score };
  });
  scored.sort((x, y) => y.score - x.score);
  const top3 = scored.slice(0, 3);
  const nonZero = top3.filter((s) => s.score > 0);
  return (nonZero.length ? nonZero : top3.slice(0, 1)).map((s) => s.d);
}
