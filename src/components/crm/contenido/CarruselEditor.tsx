"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, ArrowDown, X, Upload, Images, Loader2, Check } from "lucide-react";
import type { DevelopmentImage, SocialPostFormat, SocialPostImage, SocialPostPlacement } from "@/lib/schema";
import { Modal } from "@/components/crm/Modal";
import { Miniatura } from "@/components/crm/Miniatura";
import { ConfirmDialog } from "@/components/crm/ConfirmDialog";
import { SectionHeader } from "@/components/crm/PageShell";
import { mismoOrigen } from "@/components/crm/contenido/imagen";
import {
  cambiarFormatoYPlacement,
  agregarImagenCarruselDesdeCatalogo,
  agregarImagenCarruselSubida,
  quitarImagenCarrusel,
  reordenarImagenesCarrusel,
} from "@/app/admin/(panel)/contenido/actions";

/**
 * Formato (post/carrusel), destino (feed/story) e imágenes 2+ del carrusel. La imagen 1
 * es la del post (`portadaUrl`) y se edita arriba, aquí solo se muestra para ver el orden
 * real. Cada cambio se guarda al momento, igual que el recorte y el overlay.
 */

const grupo = "flex flex-wrap gap-2";
const etiqueta = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";
const nota = "mt-2 text-[12px] leading-snug text-[var(--crm-ink-mute)]";

export function CarruselEditor({
  postId,
  portadaUrl,
  format,
  placement,
  imagenes,
  fotosCatalogo,
}: {
  postId: string;
  portadaUrl: string;
  format: SocialPostFormat;
  placement: SocialPostPlacement;
  imagenes: SocialPostImage[];
  /** Galería del desarrollo del post. Vacía si el post es de tema libre. */
  fotosCatalogo: DevelopmentImage[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [catalogo, setCatalogo] = useState(false);
  const [quitando, setQuitando] = useState<SocialPostImage | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const esCarrusel = format === "carrusel";
  const esStory = placement === "stories";
  const total = imagenes.length + 1;
  const yaEnCarrusel = new Set(imagenes.map((i) => mismoOrigen(i.url)));

  function correr(accion: () => Promise<{ ok: true } | { error: string }>) {
    setError(null);
    start(async () => {
      const res = await accion();
      if ("error" in res) setError(res.error);
    });
  }

  // Story y carrusel no conviven: elegir story baja el formato a post en la misma llamada.
  function cambiar(nuevo: { format?: SocialPostFormat; placement?: SocialPostPlacement }) {
    const siguiente = {
      format: nuevo.format ?? format,
      placement: nuevo.placement ?? placement,
    };
    if (siguiente.placement === "stories") siguiente.format = "post";
    if (siguiente.format === format && siguiente.placement === placement) return;
    correr(() => cambiarFormatoYPlacement(postId, siguiente));
  }

  function mover(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= imagenes.length) return;
    const ids = imagenes.map((i) => i.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    correr(() => reordenarImagenesCarrusel(postId, ids));
  }

  async function subir(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await agregarImagenCarruselSubida(postId, fd);
      if ("error" in res) setError(res.error);
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const ocupado = pending || subiendo;

  return (
    <section className="crm-card crm-fade p-6" style={{ animationDelay: "55ms" }}>
      <SectionHeader title="Formato y destino" className="mb-4" />

      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <span className={etiqueta}>Formato</span>
          <div role="radiogroup" aria-label="Formato del post" className={grupo}>
            <Pill
              activo={!esCarrusel}
              deshabilitado={ocupado || esStory}
              onClick={() => cambiar({ format: "post" })}
              label="Post"
              detalle="1 imagen"
            />
            <Pill
              activo={esCarrusel}
              deshabilitado={ocupado || esStory}
              onClick={() => cambiar({ format: "carrusel" })}
              label="Carrusel"
              detalle="hasta 10"
            />
          </div>
        </div>

        <div>
          <span className={etiqueta}>Dónde aparece</span>
          <div role="radiogroup" aria-label="Destino del post" className={grupo}>
            <Pill
              activo={!esStory}
              deshabilitado={ocupado}
              onClick={() => cambiar({ placement: "timeline" })}
              label="Feed"
            />
            <Pill
              activo={esStory}
              deshabilitado={ocupado}
              onClick={() => cambiar({ placement: "stories" })}
              label="Story"
            />
          </div>
        </div>
      </div>

      <p className={nota}>
        {esStory
          ? "En story va una sola imagen: Post for Me no arma carruseles ahí, publicaría cada foto como una story suelta."
          : esCarrusel
            ? `Se publican ${total} imágenes en este orden, deslizables en el mismo post.`
            : "Sale una sola imagen en el feed de las dos redes."}
      </p>

      {esCarrusel && (
        <div className="mt-5 border-t border-[var(--crm-line)] pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[13.5px] font-medium text-[var(--crm-ink)]">
              Imágenes del carrusel <span className="crm-num text-[var(--crm-ink-mute)]">({total})</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {fotosCatalogo.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCatalogo(true)}
                  disabled={ocupado}
                  className="crm-btn crm-btn-sm crm-btn-secondary"
                >
                  <Images className="size-3.5" strokeWidth={2} />
                  Elegir del desarrollo
                </button>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={ocupado}
                className="crm-btn crm-btn-sm crm-btn-secondary"
              >
                {subiendo ? (
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <Upload className="size-3.5" strokeWidth={2} />
                )}
                Subir imagen
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) subir(f);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile url={portadaUrl} indice={1} etiquetaFija="Portada" />
            <AnimatePresence initial={false}>
              {imagenes.map((img, i) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                >
                  <Tile
                    url={img.url}
                    indice={i + 2}
                    controles={
                      <>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={ocupado || i === 0}
                            onClick={() => mover(i, -1)}
                            className="crm-btn crm-btn-ghost crm-btn-sm !px-1.5"
                            aria-label="Mover antes"
                          >
                            <ArrowUp className="size-3.5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            disabled={ocupado || i === imagenes.length - 1}
                            onClick={() => mover(i, 1)}
                            className="crm-btn crm-btn-ghost crm-btn-sm !px-1.5"
                            aria-label="Mover después"
                          >
                            <ArrowDown className="size-3.5" strokeWidth={2} />
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => setQuitando(img)}
                          className="crm-btn crm-btn-ghost crm-btn-sm !px-1.5"
                          aria-label="Quitar del carrusel"
                        >
                          <X className="size-3.5" strokeWidth={2} />
                        </button>
                      </>
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {imagenes.length === 0 && (
            <p className={nota}>
              Por ahora solo está la portada. Agrega al menos una imagen más, si no sale como post normal.
            </p>
          )}
          <p className={nota}>
            El recorte, el texto encima y la edición con IA aplican solo a la portada. Las demás se publican tal
            cual, así que conviene que ya vengan en el mismo formato.
          </p>
        </div>
      )}

      {!esCarrusel && imagenes.length > 0 && (
        <p className={nota}>
          Hay <span className="crm-num">{imagenes.length}</span>{" "}
          {imagenes.length === 1 ? "imagen guardada" : "imágenes guardadas"} del carrusel. En este formato no se
          publican; vuelven a aparecer si eliges Carrusel.
        </p>
      )}

      {error && (
        <p className="mt-3 text-[12.5px] leading-snug" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}

      <Modal
        open={catalogo}
        onClose={() => setCatalogo(false)}
        title="Fotos del desarrollo"
        maxWidth={620}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-[var(--crm-ink-mute)]">
              Se copian al carrusel; siguen en el catálogo del desarrollo.
            </span>
            <button type="button" onClick={() => setCatalogo(false)} className="crm-btn crm-btn-sm crm-btn-secondary">
              Listo
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-2.5">
          {fotosCatalogo.map((foto) => {
            const puesta = yaEnCarrusel.has(mismoOrigen(foto.url));
            return (
              <button
                key={foto.id}
                type="button"
                disabled={puesta || ocupado}
                onClick={() => correr(() => agregarImagenCarruselDesdeCatalogo(postId, foto.id))}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-[var(--crm-line)] bg-[var(--crm-surface)] transition-colors hover:border-[var(--crm-ink-faint)] disabled:cursor-default"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.alt ?? ""}
                  className="h-full w-full object-cover transition-transform duration-200 group-enabled:group-hover:scale-[1.04]"
                  style={{ opacity: puesta ? 0.35 : 1 }}
                />
                {puesta && (
                  <span className="crm-badge crm-badge-wine absolute left-1.5 top-1.5">
                    <Check className="size-3" strokeWidth={2.4} /> En el carrusel
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!quitando}
        onClose={() => setQuitando(null)}
        onConfirm={() => {
          const id = quitando?.id;
          if (!id) return;
          start(async () => {
            const res = await quitarImagenCarrusel(id);
            if ("error" in res) setError(res.error);
            setQuitando(null);
          });
        }}
        title="Quitar del carrusel"
        description={
          quitando?.pathname?.startsWith("contenido/")
            ? "Esta imagen se subió para este post: al quitarla se borra."
            : "Sale del carrusel. La foto sigue en la galería del desarrollo."
        }
        confirmLabel="Quitar"
        destructive
        pending={pending}
      />
    </section>
  );
}

function Tile({
  url,
  indice,
  etiquetaFija,
  controles,
}: {
  url: string;
  indice: number;
  etiquetaFija?: string;
  controles?: React.ReactNode;
}) {
  return (
    <div className="crm-card overflow-hidden p-0">
      <div className="relative aspect-[4/5] bg-[var(--crm-surface)]">
        <Miniatura src={url} className="block h-full w-full" />
        <span className="crm-num absolute left-1.5 top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black/65 px-1.5 text-[11px] font-semibold text-white">
          {indice}
        </span>
      </div>
      <div className="flex min-h-[38px] items-center justify-between gap-1 px-2 py-1.5">
        {etiquetaFija ? (
          <span className="text-[11.5px] text-[var(--crm-ink-mute)]">{etiquetaFija}</span>
        ) : (
          controles
        )}
      </div>
    </div>
  );
}

function Pill({
  activo,
  deshabilitado,
  onClick,
  label,
  detalle,
}: {
  activo: boolean;
  deshabilitado: boolean;
  onClick: () => void;
  label: string;
  detalle?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      disabled={deshabilitado}
      onClick={onClick}
      className="crm-tab disabled:opacity-50"
      data-active={activo}
    >
      {label}
      {detalle && <span className="text-[12px] text-[var(--crm-ink-mute)]">{detalle}</span>}
    </button>
  );
}
