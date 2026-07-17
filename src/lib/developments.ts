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
  name: string;
  place: string; // ubicación legible para la card
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
    name: "Xo'ok",
    place: "Yucatán, selva maya",
    zona: "selva",
    tipos: ["terreno", "casa"],
    usos: ["invertir", "vivir"],
    etapa: "preventa",
    image: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club Xenotikal en el desarrollo Xo'ok, Yucatán",
    blurb:
      "Desarrollo residencial en la selva de Yucatán, 7 etapas, con casa club Xenotikal inspirada en los cenotes.",
    specs: [
      { label: "Aparta con", value: "$10,000 MXN" },
      { label: "Enganche", value: "25%" },
      { label: "Etapas", value: "7" },
    ],
  },
  {
    slug: "ciudad-central-merida",
    name: "Ciudad Central Mérida",
    place: "Mérida, Yucatán",
    zona: "merida",
    tipos: ["terreno", "casa"],
    usos: ["invertir", "vivir"],
    etapa: "entrega_inmediata",
    image: "/hero/ccm-casa-club.webp",
    alt: "Casa club y alberca de Ciudad Central Mérida",
    blurb:
      "Comunidad planeada en Mérida con más de 6,000 unidades comercializadas en 9 etapas, casa club y zona comercial.",
  },
  {
    slug: "ciudad-central-progreso",
    name: "Ciudad Central Progreso",
    place: "Progreso, Yucatán, frente al mar",
    zona: "costa",
    tipos: ["terreno"],
    usos: ["invertir", "vivir"],
    etapa: "en_construccion",
    image: "/hero/ccp-pabellon.webp",
    alt: "Pabellón de Ciudad Central Progreso, frente al mar",
    blurb:
      "Comunidad planeada frente al mar en Progreso, más de 3,800 unidades en 6 etapas, con club de playa.",
  },
  {
    slug: "ukana-playa-del-carmen",
    name: "Ukana Playa del Carmen",
    place: "Playa del Carmen, Quintana Roo",
    zona: "caribe",
    tipos: ["departamento"],
    usos: ["invertir", "vivir"],
    etapa: "entrega_inmediata",
    image: "/hero/ukana-pdc-alberca.webp",
    alt: "Alberca entregada de Ukana Playa del Carmen",
    blurb:
      "Desarrollo vertical de departamentos en Playa del Carmen, entregado, con alberca y gimnasio.",
  },
  {
    slug: "tulum-ha",
    name: "Tulum Ha",
    place: "Tulum, Quintana Roo",
    zona: "caribe",
    tipos: ["departamento"],
    usos: ["invertir"],
    etapa: "en_construccion",
    image: "/hero/tulum-ha-avance.webp",
    alt: "Avance de obra del desarrollo Tulum Ha",
    blurb:
      "Desarrollo vertical de departamentos en Tulum, en construcción, con avance de obra en curso.",
  },
];

export type QuizAnswers = {
  uso: Uso;
  zona: Zona;
  tipo: Tipo;
  etapa: Etapa | "cualquiera";
};

// Empareja las respuestas del quiz con los desarrollos reales. Ponderado: la zona pesa
// más, luego el tipo de propiedad, luego uso y etapa. Devuelve los 2 mejores (siempre
// devuelve algo: si nada calza fuerte, el mejor esfuerzo + el segundo).
export function matchDevelopments(a: QuizAnswers): Development[] {
  const scored = DEVELOPMENTS.map((d) => {
    let score = 0;
    if (d.zona === a.zona) score += 3;
    if (d.tipos.includes(a.tipo)) score += 2;
    if (d.usos.includes(a.uso)) score += 1;
    if (a.etapa !== "cualquiera" && d.etapa === a.etapa) score += 1;
    return { d, score };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, 2).map((s) => s.d);
}
