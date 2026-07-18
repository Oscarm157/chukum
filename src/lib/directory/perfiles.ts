import type { PerfilSlug, PlaceCategory } from "../schema-directory";

// Los 4 perfiles del eje "por estilo de vida". Constante en código, no tabla: son pocos y estables.
// `directorio` = qué categorías del directorio le importan a ese perfil (para el cruce perfil ↔ directorio).
// El "día a día" largo vive como guía (tabla guides), no aquí; aquí solo el metadato y un intro corto.

export type Perfil = {
  slug: PerfilSlug;
  label: string;
  /** una línea, formal y descriptiva, de a qué viene este perfil */
  intro: string;
  /** lo que de verdad le pesa al decidir; alimenta la guía y el filtro del directorio */
  importa: string[];
  /** categorías del directorio relevantes para este perfil */
  directorio: PlaceCategory[];
};

export const PERFILES: Perfil[] = [
  {
    slug: "me-mudo",
    label: "Me mudo",
    intro: "Traslada su vida completa a Yucatán: familia, trabajo y rutina diaria.",
    importa: ["costo de vida", "colegios", "hospitales", "comunidad", "trámites de residencia"],
    directorio: ["cocina-yucateca", "cafe", "coworking", "hospital", "colegio", "supermercado", "mercado"],
  },
  {
    slug: "vacaciones",
    label: "Casa de vacaciones",
    intro: "Segunda residencia para temporadas: playa cerca y mantenimiento simple.",
    importa: ["playa", "clima", "seguridad", "servicios", "conectividad de vuelos"],
    directorio: ["restaurante", "bar", "cocina-yucateca", "cenote-playa", "cultura"],
  },
  {
    slug: "inversion",
    label: "Inversión",
    intro: "Compra por retorno: renta, ocupación de renta corta y plusvalía de zona.",
    importa: ["ROI", "plusvalía", "renta corta", "zonas en crecimiento", "demanda turística"],
    directorio: ["restaurante", "cafe", "bar", "coworking", "cenote-playa"],
  },
  {
    slug: "retiro",
    label: "Retiro",
    intro: "Busca tranquilidad, salud accesible y una comunidad ya establecida.",
    importa: ["salud", "tranquilidad", "comunidad expat", "clima", "costo de vida"],
    directorio: ["hospital", "cafe", "cocina-yucateca", "cultura", "supermercado"],
  },
];

const bySlug = new Map(PERFILES.map((p) => [p.slug, p]));

export function getPerfil(slug: string): Perfil | null {
  return bySlug.get(slug as PerfilSlug) ?? null;
}

export const PERFIL_SLUGS = PERFILES.map((p) => p.slug);
