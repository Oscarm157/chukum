import type { PerfilSlug, PlaceCategory } from "../schema-directory";
import { PERFIL_SLUGS } from "./perfiles";

// Filtros del directorio serializados a la URL (patrón de inmobiq/listings-filters, adaptado).
// Puro: sirve para leer los searchParams del server component y para construir el href del filtro.

// Metadatos de categoría para la UI (label + icono). El icono es un nombre lógico; el mapeo a un
// componente de icono vive en la capa de UI (fase 1), no aquí.
export const CATEGORIES: { value: PlaceCategory; label: string; icon: string }[] = [
  { value: "restaurante", label: "Restaurantes", icon: "restaurant" },
  { value: "cafe", label: "Cafés", icon: "coffee" },
  { value: "bar", label: "Bares", icon: "wine" },
  { value: "cocina-yucateca", label: "Cocina yucateca", icon: "local-dish" },
  { value: "brunch", label: "Brunch", icon: "brunch" },
  { value: "mercado", label: "Mercados", icon: "market" },
  { value: "coworking", label: "Coworkings", icon: "laptop" },
  { value: "gimnasio", label: "Gimnasios", icon: "dumbbell" },
  { value: "hospital", label: "Hospitales", icon: "hospital" },
  { value: "colegio", label: "Colegios", icon: "school" },
  { value: "supermercado", label: "Supermercados", icon: "cart" },
  { value: "cenote-playa", label: "Cenotes y playas", icon: "wave" },
  { value: "cultura", label: "Cultura", icon: "landmark" },
];

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.value));
const VALID_PERFILES = new Set<string>(PERFIL_SLUGS);

export type DirectoryFilters = {
  categoria: PlaceCategory | null;
  zona: string | null; // slug de zona (se valida contra la tabla zonas en la query)
  perfil: PerfilSlug | null;
};

// Acepta el objeto searchParams de Next (valores string | string[] | undefined) o URLSearchParams.
type ParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(input: ParamsInput, key: string): string | null {
  const raw = input instanceof URLSearchParams ? input.get(key) : input[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value.trim() ? value.trim() : null;
}

/** Lee y sanea los filtros desde los searchParams. Descarta valores no válidos. */
export function parseDirectoryFilters(input: ParamsInput): DirectoryFilters {
  const categoria = readParam(input, "categoria");
  const perfil = readParam(input, "perfil");
  const zona = readParam(input, "zona");
  return {
    categoria: categoria && VALID_CATEGORIES.has(categoria) ? (categoria as PlaceCategory) : null,
    zona: zona ? zona.toLowerCase() : null,
    perfil: perfil && VALID_PERFILES.has(perfil) ? (perfil as PerfilSlug) : null,
  };
}

/** Construye los searchParams para un href de filtro. Omite lo nulo (URLs limpias). */
export function buildDirectoryParams(filters: Partial<DirectoryFilters>): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.categoria) p.set("categoria", filters.categoria);
  if (filters.zona) p.set("zona", filters.zona);
  if (filters.perfil) p.set("perfil", filters.perfil);
  return p;
}

/** Href del directorio con un filtro cambiado (útil para las pills de la UI). */
export function directoryHref(current: DirectoryFilters, patch: Partial<DirectoryFilters>): string {
  const params = buildDirectoryParams({ ...current, ...patch });
  const qs = params.toString();
  return qs ? `/vivir-en-merida/directorio?${qs}` : "/vivir-en-merida/directorio";
}
