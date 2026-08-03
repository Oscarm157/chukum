"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, Type, Sparkles, Loader2, Save, Maximize2 } from "lucide-react";
import { Modal } from "@/components/crm/Modal";
import { Lightbox, useLightbox } from "@/components/crm/Lightbox";
import { PasoRecorte } from "@/components/crm/contenido/PasoRecorte";
import { PasoTexto } from "@/components/crm/contenido/PasoTexto";
import { PasoIA } from "@/components/crm/contenido/PasoIA";

/**
 * Editor de la imagen del post en un solo modal. Los tres pasos (recorte, texto, IA)
 * trabajan encadenados sobre una imagen que vive en memoria: cada uno recibe el resultado
 * del anterior y ninguno persiste nada. La subida a Blob y el guardado ocurren una sola
 * vez, en "Guardar cambios en la imagen", que es cuando se llama `onGuardar`.
 */

type Paso = "recorte" | "texto" | "ia";

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
   * lanza un Error, su mensaje se muestra en el modal y el trabajo no se pierde.
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

  const bloqueado = ocupado || guardando;

  return (
    <>
      <Modal
        open={open}
        // Con el lightbox encima, Esc y el click fuera son suyos: no deben cerrar el editor
        // y tirar el trabajo en memoria.
        onClose={() => {
          if (!lightbox.open && !bloqueado) onClose();
        }}
        title="Editar imagen"
        maxWidth={660}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p
              className="max-w-[36ch] text-[12px] leading-snug"
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
          </div>
        }
      >
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-[var(--crm-line)] bg-[var(--crm-surface)] p-2.5">
          <button
            type="button"
            onClick={() => lightbox.abrir(trabajo.url)}
            aria-label="Ver la imagen de trabajo en grande"
            className="group relative size-14 shrink-0 overflow-hidden rounded-md border border-[var(--crm-line)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={trabajo.url} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2 className="size-4" strokeWidth={2} />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium text-[var(--crm-ink)]">
              {cambios.length === 0 ? "Imagen actual del post" : "Imagen de trabajo, sin guardar"}
            </p>
            {cambios.length === 0 ? (
              <p className="mt-1 hidden text-[12px] leading-snug text-[var(--crm-ink-mute)] sm:block">
                Recorta, ponle texto o pide un cambio con IA. Puedes encadenar los tres sin cerrar esta ventana.
              </p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {cambios.map((c) => (
                  <span key={c.paso} className="crm-badge crm-badge-wine">
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* En móvil sobra: la miniatura de al lado ya abre el lightbox. */}
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
        </div>

        {/* En pantalla angosta la fila se desliza en vez de partirse en dos renglones. */}
        <div role="tablist" aria-label="Paso de edición" className="mb-3 flex gap-2 overflow-x-auto sm:flex-wrap">
          {PASOS.map(({ id, label, Icono }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={paso === id}
              disabled={bloqueado}
              onClick={() => setPaso(id)}
              className="crm-tab shrink-0 disabled:opacity-50"
              data-active={paso === id}
            >
              <Icono className="size-3.5" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {paso === "recorte" && (
          <PasoRecorte
            src={trabajo.url}
            onBusy={setOcupado}
            onAplicar={(file, formato) => aplicarPaso(file, "recorte", `Recorte ${formato}`)}
          />
        )}
        {paso === "texto" && (
          <PasoTexto src={trabajo.url} onBusy={setOcupado} onAplicar={(file) => aplicarPaso(file, "texto", "Con texto")} />
        )}
        {paso === "ia" && (
          <PasoIA
            src={trabajo.url}
            onBusy={setOcupado}
            onVer={lightbox.abrir}
            onAplicar={(file) => aplicarPaso(file, "ia", "Editada con IA")}
          />
        )}
      </Modal>

      <Lightbox src={lightbox.src} open={lightbox.open} onClose={lightbox.cerrar} />
    </>
  );
}
