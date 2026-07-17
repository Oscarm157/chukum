// La correduría: quien firma el sitio y quien se declara como Organization en structured data.
export const BRAND = {
  name: "Chukum",
  url: "https://chukum.mx",
  // TODO: número real de WhatsApp de Oscar. Placeholder mientras tanto (formato E.164 sin +).
  whatsapp: "5219990000000",
} as const;

// Marca del motor de contenido SEO que cuelga de /vivir-*. Es una línea editorial, no una
// entidad legal: por eso no firma el JSON-LD ni aparece como Organization.
export const CONTENT_BRAND = { name: "Vivir en Yucatán" } as const;

// Deep link de WhatsApp con mensaje pre-armado.
export function waLink(text: string): string {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
}

// Etiqueta legible de cada estado de comercialización. Fuente única para home y ficha.
export const STATUS_LABEL: Record<string, string> = {
  preventa: "Preventa",
  en_construccion: "En construcción",
  entrega_inmediata: "Entrega inmediata",
  vendido: "Vendido",
};
