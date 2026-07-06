// Constantes de marca del sitio público. Fuente de verdad para nombre, URL y contacto.
export const SITE = {
  name: "Vivir en Yucatán",
  url: "https://vivirenyucatan.com",
  // TODO: número real de WhatsApp de Oscar. Placeholder mientras tanto (formato E.164 sin +).
  whatsapp: "5219990000000",
} as const;

// Deep link de WhatsApp con mensaje pre-armado.
export function waLink(text: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

// Etiqueta legible de cada estado de comercialización. Fuente única para home y ficha.
export const STATUS_LABEL: Record<string, string> = {
  preventa: "Preventa",
  en_construccion: "En construcción",
  entrega_inmediata: "Entrega inmediata",
  vendido: "Vendido",
};
