import { BRAND } from "@/lib/site";

/**
 * Piezas compartidas por los editores de imagen del post (recorte y overlay de texto).
 */

// Tope del lado largo de lo que se exporta. Instagram no muestra más de ~1440px de ancho
// y un JPEG de 4000px se pasa del límite de 8MB de `uploadImage`.
export const MAX_LADO = 2048;

// Las fotos del catálogo se guardan con la URL absoluta del sitio. Servidas desde el
// mismo origen el canvas puede leerlas; con el dominio completo, en local serían
// cross-origin y la exportación fallaría por tainted canvas.
export function mismoOrigen(src: string): string {
  return src.startsWith(BRAND.url) ? src.slice(BRAND.url.length) : src;
}

export function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}
