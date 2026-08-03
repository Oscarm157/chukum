"use client";

import { Maximize2 } from "lucide-react";
import { Lightbox, useLightbox } from "@/components/crm/Lightbox";

/**
 * Miniatura que abre la imagen en grande. Envuelve el `<img>` en un botón para que la
 * acción sea real (teclado incluido) y no un div con onClick.
 */
export function Miniatura({
  src,
  alt = "",
  className,
  imgClassName = "h-full w-full object-cover",
}: {
  src: string;
  alt?: string;
  /** Tamaño y borde de la caja: lo decide quien la usa (tabla, tile del carrusel). */
  className: string;
  imgClassName?: string;
}) {
  const lightbox = useLightbox();

  return (
    <>
      <button
        type="button"
        onClick={() => lightbox.abrir(src)}
        aria-label="Ver la imagen en grande"
        className={`group relative overflow-hidden ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={imgClassName} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="size-4" strokeWidth={2} />
        </span>
      </button>
      <Lightbox src={lightbox.src} open={lightbox.open} onClose={lightbox.cerrar} alt={alt} />
    </>
  );
}
