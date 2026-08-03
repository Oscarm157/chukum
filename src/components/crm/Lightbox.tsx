"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

/**
 * Ver una imagen en grande. Mismo patrón de portal/Esc/click-fuera/bloqueo de scroll que
 * `Modal.tsx`, pero sin card: la imagen ocupa casi toda la pantalla, sin controles de
 * zoom/pan (el pedido es "verla en grande", no un editor).
 */
export function Lightbox({
  src,
  alt = "",
  open,
  onClose,
}: {
  src: string | null;
  alt?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !src) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ background: "rgba(4,6,10,0.86)" }}
          className="crm-root fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="crm-btn crm-btn-ghost crm-btn-sm absolute right-4 top-4 !px-1.5 text-white hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
          <motion.img
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-[var(--crm-shadow-pop)]"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Estado mínimo para abrir el lightbox desde cualquier miniatura: `abrir(url)` / cerrar. */
export function useLightbox() {
  const [src, setSrc] = useState<string | null>(null);
  return {
    src,
    open: src !== null,
    abrir: (url: string) => setSrc(url),
    cerrar: () => setSrc(null),
  };
}
