// Contenido curado y verídico para la página de detalle de desarrollo (guía "Vivir en Yucatán").
// Fuente: investigación del material público del desarrollador + datos confirmados. NO inventar:
// solo se agrega aquí lo que se pudo verificar. REGLA DURA: prohibido el nombre comercial del
// desarrollo y del desarrollador; la identidad pública es el `heading` por ubicación.
//
// La DB gobierna los campos core (heading, ubicación, etapa, tipos, specs, imágenes). Este módulo
// añade las secciones ricas (por qué es opción ideal, amenidades, lugares cercanos) que aún no
// viven en la DB. Se cruza por slug. Poblados los tres activos (selva-maya, norte-de-merida,
// progreso-frente-al-mar); los demos y cualquier slug sin entrada degradan elegante (sin secciones).

export type DevelopmentContent = {
  // Frase de una línea, factual, sin nombre comercial. Encabeza el hero.
  tagline: string;
  // Por qué es una opción ideal: bullets factuales, cada uno un motivo real.
  whyIdeal: string[];
  // Amenidades reales (sin nombres de marca de las amenidades).
  amenities: string[];
  // Lugares cercanos / entorno, a nivel región (lo verificable). Cada uno {label, hint}.
  nearby: { label: string; hint: string }[];
};

export const DEVELOPMENT_CONTENT: Record<string, DevelopmentContent> = {
  "selva-maya": {
    tagline:
      "Comunidad residencial en la selva maya, en preventa por etapas, con casa club, parque central y club de playa.",
    whyIdeal: [
      "En preventa: entras temprano, en las primeras de siete etapas residenciales.",
      "Aparta con $10,000 MXN y 25% de enganche.",
      "Casa club con alberca, parque central y club de playa incluidos.",
      "En la selva de Yucatán, con conectividad hacia Mérida.",
    ],
    amenities: [
      "Casa club con alberca y spa",
      "Parque central de 413 m con paisajismo de plantas endémicas",
      "Senderos, terraza de reuniones y área de grill",
      "Área infantil y pet park",
      "Caseta de acceso de 8 carriles",
      "Club de playa",
    ],
    nearby: [
      { label: "Mérida", hint: "Conectividad hacia la ciudad" },
      { label: "Cenotes", hint: "Cenotes y acuíferos naturales de la zona" },
      { label: "Costa", hint: "Playas de la costa yucateca" },
    ],
  },

  "norte-de-merida": {
    tagline:
      "Comunidad planeada de gran escala al norte de Mérida, con casas club, ciclovías y zonas comerciales, conectada al periférico.",
    whyIdeal: [
      "Comunidad planeada con lotes residenciales y townhouses, con unidades ya entregándose.",
      "Conectada al periférico, a minutos de plazas comerciales, hospitales y universidades.",
      "Casas club con alberca, canchas deportivas y áreas sociales dentro del complejo.",
      "Ciclovías, áreas verdes y zonas comerciales integradas al plan maestro.",
    ],
    amenities: [
      "Casas club con alberca, terrazas y espacios sociales",
      "Canchas deportivas y ciclovías",
      "Áreas infantiles y zonas de lectura",
      "Espacios culturales y de eventos",
      "Área de food trucks y bike park",
      "Acceso controlado, vigilancia 24/7 e instalaciones subterráneas",
    ],
    nearby: [
      { label: "Periférico de Mérida", hint: "Conexión directa a la ciudad" },
      { label: "Plazas, hospitales y universidades", hint: "A minutos del complejo" },
      { label: "Club de playa", hint: "En la costa de Yucatán, para los residentes" },
    ],
  },

  "progreso-frente-al-mar": {
    tagline:
      "Comunidad planeada en la costa de Yucatán, a 14 km de la playa de Progreso y 19 km de Mérida, con club de playa, privadas con casa club y lago con muelle.",
    whyIdeal: [
      "En construcción: lotes residenciales dentro de un plan maestro por etapas.",
      "A 14 km de la playa de Progreso y 19 km de Mérida, con acceso directo al periférico.",
      "16 privadas residenciales, cada una con su casa club.",
      "Club de playa con alberca, bar y rooftop, lago con muelle y manantiales naturales.",
    ],
    amenities: [
      "Club de playa con alberca, bar y rooftop",
      "16 privadas residenciales con casa club",
      "Lago con muelle, canales de agua y manantiales naturales",
      "Ciclovías y canchas deportivas",
      "Más de 174,000 m² de áreas verdes y 60,000 m² de zonas comerciales",
      "Calles pavimentadas, acceso controlado e instalaciones subterráneas",
    ],
    nearby: [
      { label: "Playa de Progreso", hint: "A 14 km, playa con bandera azul" },
      { label: "Mérida", hint: "A 19 km, con acceso directo al periférico" },
      { label: "Chicxulub", hint: "Puerto y museo del meteorito en la zona" },
    ],
  },
};

export function getDevelopmentContent(slug: string): DevelopmentContent | undefined {
  return DEVELOPMENT_CONTENT[slug];
}
