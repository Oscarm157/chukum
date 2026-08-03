// Fuente única de tipos de propiedad y sus etiquetas en español. Client-safe: sin
// dependencias de servidor, para poder importarse tanto desde componentes cliente (home V2,
// quiz) como desde páginas server (zonas, vivir-en-merida) y el admin. Los valores deben
// coincidir literal con `UnitType` en `src/lib/schema.ts` (la DB es la fuente real del dato;
// este archivo solo centraliza cómo se traduce y se pinta).
export type PropertyType = "terreno" | "casa" | "departamento" | "townhouse" | "local_comercial";

export const PROPERTY_TYPES: PropertyType[] = [
  "terreno",
  "casa",
  "departamento",
  "townhouse",
  "local_comercial",
];

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  terreno: "Terreno",
  casa: "Casa",
  departamento: "Departamento",
  townhouse: "Townhouse",
  local_comercial: "Local comercial",
};
