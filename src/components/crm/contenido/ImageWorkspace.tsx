"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Crop, Type, Sparkles, Loader2, Save, Maximize2, X } from "lucide-react";
import { Lightbox, useLightbox } from "@/components/crm/Lightbox";
import { PasoRecorte } from "@/components/crm/contenido/PasoRecorte";
import { PasoTexto } from "@/components/crm/contenido/PasoTexto";
import { PasoIA } from "@/components/crm/contenido/PasoIA";

/**
 * Editor de la imagen del post: una vista de pantalla completa, no un diálogo. Los tres
 * pasos (recorte, texto, IA) trabajan encadenados sobre una imagen que vive en memoria:
 * cada uno recibe el resultado del anterior y ninguno persiste nada. La subida a Blob y el
 * guardado ocurren una sola vez, en "Guardar cambios en la imagen", que llama `onGuardar`.
 *
 * El continente es propio (portal a <body>, `fixed inset-0`) en vez de `Modal`: el editor
 * necesita todo el alto y el ancho de la pantalla, y el panel de un modal está topado.
 */

type Paso = "recorte" | "texto" | "ia";

// El portal necesita `document.body`, que no existe al prerenderizar. Esto es false en el
// servidor y true en el cliente, sin escribir estado dentro de un efecto.
const sinSuscripcion = () => () => {};
const useMontado = () =>
  useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false
  );

const PASOS: { id: Paso; label: string; Icono: typeof Crop }[] = [
  { id: "recorte", label: "Recortar", Icono: Crop },
  { id: "texto", label: "Texto", Icono: Type },
  { id: "ia", label: "Editar con IA", Icono: Sparkles },
];

export function ImageWorkspace({
  open,
  src,
  onClose,
  onGuardar,
}: {
  open: boolean;
  /** Imagen del post ya guardada, o object URL del archivo local en la pantalla de alta. */
  src: string;
  onClose: () => void;
  /**
   * Se llama una sola vez, con la imagen final y el resumen de los pasos aplicados. Si
   * lanza un Error, su mensaje se muestra abajo y el trabajo no se pierde.
   */
  onGuardar: (file: File, resumen: string) => void | Promise<void>;
}) {
  const [paso, setPaso] = useState<Paso>("recorte");
  // `file` en null significa que sigue siendo la imagen original: no hay nada que subir.
  const [trabajo, setTrabajo] = useState<{ url: string; file: File | null }>({ url: src, file: null });
  const [cambios, setCambios] = useState<{ paso: Paso; label: string }[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const montado = useMontado();
  const lightbox = useLightbox();
  // Object URLs creados aquí. Se sueltan al cerrar, no antes: el archivo final se entrega
  // al llamador, que arma el suyo.
  const creadosRef = useRef<string[]>([]);

  // Cada apertura arranca de la imagen del post: lo que se descartó no revive. Se ajusta
  // en el render para no pintar un frame con la imagen de la sesión anterior.
  const sesion = open ? src : "";
  const [sesionPrevia, setSesionPrevia] = useState(sesion);
  if (sesionPrevia !== sesion) {
    setSesionPrevia(sesion);
    setTrabajo({ url: src, file: null });
    setCambios([]);
    setPaso("recorte");
    setError(null);
  }

  useEffect(() => {
    if (open) return;
    creadosRef.current.forEach(URL.revokeObjectURL);
    creadosRef.current = [];
  }, [open]);

  const bloqueado = ocupado || guardando;

  // El scroll se bloquea en <html> Y en <body>: el elemento que de verdad scrollea en este
  // documento es <html> (medido), así que bloquear solo `body` deja la página moviéndose de
  // fondo. Este efecto depende SOLO de `open`: si se reejecutara al abrir el lightbox (que
  // pone su propio `hidden`) guardaría "hidden" como valor previo y al cerrar el editor la
  // página se quedaría sin scroll.
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  // Esc cierra, salvo que el lightbox esté encima (Esc es suyo) o haya un paso corriendo.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lightbox.open && !bloqueado) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, lightbox.open, bloqueado]);

  // El resultado de un paso reemplaza la imagen de trabajo; el siguiente paso lo recibe
  // como su fondo.
  function aplicarPaso(file: File, id: Paso, label: string) {
    const url = URL.createObjectURL(file);
    creadosRef.current.push(url);
    setTrabajo({ url, file });
    setCambios((prev) => [...prev.filter((c) => c.paso !== id), { paso: id, label }]);
    setError(null);
  }

  async function guardar() {
    if (!trabajo.file) return;
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(trabajo.file, cambios.map((c) => c.label).join(" · "));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la imagen.");
    } finally {
      setGuardando(false);
    }
  }

  const pestanas = (
    // En pantalla angosta la fila se desliza; en la columna de controles caben las tres.
    <div role="tablist" aria-label="Paso de edición" className="flex gap-1.5 overflow-x-auto lg:gap-1">
      {PASOS.map(({ id, label, Icono }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={paso === id}
          disabled={bloqueado}
          onClick={() => setPaso(id)}
          className="crm-tab shrink-0 disabled:opacity-50 lg:px-2"
          data-active={paso === id}
        >
          <Icono className="size-3.5 shrink-0" strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  );

  if (!montado) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Editar imagen"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            style={{ background: "var(--crm-bg)" }}
            className="crm-root fixed inset-0 z-50 flex flex-col"
            // Lenis (scroll suave del layout raíz) mueve la página con scrollTo, y eso pasa
            // por encima de `overflow: hidden`: sin esto el fondo sigue corriéndose al
            // scrollear sobre el editor, aunque el bloqueo esté puesto. Mismo mecanismo que
            // ya usan el asistente y el carrusel.
            data-lenis-prevent
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-[var(--crm-line)] bg-[var(--crm-surface)] px-3 py-2.5 sm:px-4">
              <button
                type="button"
                onClick={() => lightbox.abrir(trabajo.url)}
                aria-label="Ver la imagen de trabajo en grande"
                className="group relative size-10 shrink-0 overflow-hidden rounded-md border border-[var(--crm-line)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={trabajo.url} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="size-3.5" strokeWidth={2} />
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-[15px] tracking-tight text-[var(--crm-ink)]">
                  Editar imagen
                </h2>
                {cambios.length === 0 ? (
                  <p className="truncate text-[12px] text-[var(--crm-ink-mute)]">Imagen actual del post</p>
                ) : (
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {cambios.map((c) => (
                      <span key={c.paso} className="crm-badge crm-badge-wine">
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* En móvil sobra: la miniatura de al lado ya abre el lightbox. El `hidden` va
                  en el contenedor porque `.crm-btn` ya fija su propio `display`. */}
              <span className="hidden shrink-0 sm:block">
                <button
                  type="button"
                  onClick={() => lightbox.abrir(trabajo.url)}
                  className="crm-btn crm-btn-sm crm-btn-ghost"
                >
                  <Maximize2 className="size-3.5" strokeWidth={2} />
                  Ver en grande
                </button>
              </span>
              <button
                type="button"
                onClick={onClose}
                disabled={bloqueado}
                aria-label="Cerrar el editor"
                className="crm-btn crm-btn-ghost crm-btn-sm shrink-0 !px-1.5"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </header>

            {/* En angosto scrollea este cuerpo; desde lg cada columna del paso scrollea sola. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={paso}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="lg:h-full"
                >
                  {paso === "recorte" && (
                    <PasoRecorte
                      src={trabajo.url}
                      pestanas={pestanas}
                      onBusy={setOcupado}
                      onAplicar={(file, formato) => aplicarPaso(file, "recorte", `Recorte ${formato}`)}
                    />
                  )}
                  {paso === "texto" && (
                    <PasoTexto
                      src={trabajo.url}
                      pestanas={pestanas}
                      onBusy={setOcupado}
                      onAplicar={(file) => aplicarPaso(file, "texto", "Con texto")}
                    />
                  )}
                  {paso === "ia" && (
                    <PasoIA
                      src={trabajo.url}
                      pestanas={pestanas}
                      onBusy={setOcupado}
                      onVer={lightbox.abrir}
                      onAplicar={(file) => aplicarPaso(file, "ia", "Editada con IA")}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--crm-line)] bg-[var(--crm-surface)] px-3 py-2.5 sm:px-4">
              <p
                className="max-w-[52ch] text-[12px] leading-snug lg:max-w-none"
                style={{ color: error ? "var(--destructive)" : "var(--crm-ink-mute)" }}
              >
                {error ?? "Los pasos se acumulan sobre la misma imagen. Nada se guarda hasta que lo confirmes aquí."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={bloqueado}
                  className="crm-btn crm-btn-sm crm-btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={bloqueado || !trabajo.file}
                  className="crm-btn crm-btn-sm crm-btn-primary"
                >
                  {guardando ? (
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Save className="size-3.5" strokeWidth={2} />
                  )}
                  Guardar cambios en la imagen
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <Lightbox src={lightbox.src} open={lightbox.open} onClose={lightbox.cerrar} />
    </>,
    document.body
  );
}
