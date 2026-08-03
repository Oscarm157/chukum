"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, Save, ImageIcon } from "lucide-react";
import type {
  DevelopmentImage,
  SocialAccount,
  SocialPostFormat,
  SocialPostImage,
  SocialPostPlacement,
} from "@/lib/schema";
import { guardarEdicion, aprobarYProgramar, actualizarImagen } from "@/app/admin/(panel)/contenido/actions";
import { ConfirmDialog } from "@/components/crm/ConfirmDialog";
import { SectionHeader } from "@/components/crm/PageShell";
import { CarruselEditor } from "@/components/crm/contenido/CarruselEditor";
import { ImageWorkspace } from "@/components/crm/contenido/ImageWorkspace";
import { SincronizarCuentasButton } from "@/components/crm/contenido/SincronizarCuentasButton";
import { PLATFORM_LABEL, fmtFecha } from "@/components/crm/contenido/badges";

const label = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";
const hint = "mt-1.5 text-[12px] leading-snug text-[var(--crm-ink-mute)]";

export function PostEditor({
  post,
  cuentas,
  imagenesCarrusel,
  fotosCatalogo,
}: {
  post: {
    id: string;
    caption: string;
    imageUrl: string;
    platforms: string[];
    scheduledAt: Date | null;
    format: SocialPostFormat;
    placement: SocialPostPlacement;
  };
  cuentas: SocialAccount[];
  /** Imágenes 2+ del carrusel, ya en orden. */
  imagenesCarrusel: SocialPostImage[];
  /** Galería del desarrollo del post; vacía si es de tema libre. */
  fotosCatalogo: DevelopmentImage[];
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(post.caption);
  const [imageUrl, setImageUrl] = useState(post.imageUrl);
  const [platforms, setPlatforms] = useState<string[]>(post.platforms);
  const [cuando, setCuando] = useState(toLocalInput(post.scheduledAt));
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [editandoImagen, setEditandoImagen] = useState(false);
  const [pending, start] = useTransition();

  const disponibles = [...new Set(cuentas.map((c) => c.platform))];
  const comoSale =
    post.placement === "stories"
      ? "Va como story de una imagen."
      : post.format === "carrusel"
        ? `Va como carrusel de ${imagenesCarrusel.length + 1} imágenes.`
        : "Va como post de una imagen.";
  const programado = cuando.trim().length > 0;
  // Un datetime-local a medio escribir da una fecha inválida: no se formatea ni se envía.
  const fechaOk = programado && !Number.isNaN(new Date(cuando).getTime());

  function toggle(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  // El workspace encadena recorte, texto e IA en memoria y entrega la imagen final una
  // sola vez: aquí hay una subida, un guardado y un refresh, sin importar cuántos pasos
  // se hayan aplicado. Si falla, el error se lanza para que el modal lo muestre sin
  // cerrarse ni perder el trabajo.
  async function guardarImagen(file: File) {
    const res = await actualizarImagen(post.id, { imageFile: file });
    if ("error" in res) throw new Error(res.error);
    setImageUrl(res.url);
    toast.success("Imagen del post actualizada.");
    router.refresh();
  }

  function guardar() {
    setError(null);
    start(async () => {
      const res = await guardarEdicion(post.id, { caption: caption.trim(), imageUrl, platforms });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      toast.success("Cambios guardados.");
      router.refresh();
    });
  }

  function abrirConfirmacion() {
    setError(null);
    if (!caption.trim()) {
      setError("El caption no puede quedar vacío.");
      return;
    }
    if (platforms.length === 0) {
      setError("Elige al menos una plataforma.");
      return;
    }
    if (programado && !fechaOk) {
      setError("Revisa la fecha: está incompleta.");
      return;
    }
    if (fechaOk && new Date(cuando).getTime() <= Date.now()) {
      setError("La fecha programada tiene que ser futura.");
      return;
    }
    setConfirmando(true);
  }

  function aprobar() {
    start(async () => {
      // Se guarda primero: `aprobarYProgramar` lee el caption de la base, así que sin
      // este paso una edición sin guardar se publicaría con el texto viejo.
      const guardado = await guardarEdicion(post.id, {
        caption: caption.trim(),
        imageUrl,
        platforms,
      });
      if ("error" in guardado) {
        setError(guardado.error);
        setConfirmando(false);
        return;
      }

      const res = await aprobarYProgramar(post.id, fechaOk ? new Date(cuando).toISOString() : null, platforms);
      setConfirmando(false);
      if ("error" in res) {
        setError(res.error);
        router.refresh();
        return;
      }
      toast.success(res.status === "programado" ? "Post programado." : "Post enviado a publicar.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="crm-card crm-fade p-6" style={{ animationDelay: "0ms" }}>
        <SectionHeader title="Imagen del post" className="mb-4" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="max-h-[240px] w-full rounded-lg border border-[var(--crm-line)] object-contain sm:w-[240px]"
            style={{ background: "var(--crm-surface)" }}
          />
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={() => setEditandoImagen(true)}
              disabled={pending}
              className="crm-btn crm-btn-sm crm-btn-secondary"
            >
              <ImageIcon className="size-3.5" strokeWidth={2} />
              Editar imagen
            </button>
            <p className="max-w-[400px] text-[12px] leading-snug text-[var(--crm-ink-mute)]">
              En una sola ventana: encuadre (cuadrado, vertical o story), título encima con una de las tres plantillas
              y cambios en la foto misma con IA (quitar un letrero, cambiar el cielo). Se guarda cuando lo confirmas
              ahí; la foto original queda intacta en el catálogo.
            </p>
          </div>
        </div>
      </section>

      <CarruselEditor
        postId={post.id}
        portadaUrl={imageUrl}
        format={post.format}
        placement={post.placement}
        imagenes={imagenesCarrusel}
        fotosCatalogo={fotosCatalogo}
      />

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "110ms" }}>
        <SectionHeader title="Texto del post" className="mb-4" />
        <textarea
          id="caption"
          aria-label="Texto del post"
          rows={8}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="crm-textarea resize-y text-[14px] leading-relaxed"
        />
        <p className={hint}>
          <span className="crm-num">{caption.length}</span> caracteres. Se publica tal cual en las dos redes.
        </p>
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "165ms" }}>
        <SectionHeader title="Dónde se publica" className="mb-4" />
        {disponibles.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[13px] leading-relaxed text-[var(--crm-ink-soft)]">
              No hay cuentas conectadas. Conecta la página de Facebook y la cuenta de Instagram en Post for Me y trae
              aquí la lista con el botón.
            </p>
            <SincronizarCuentasButton variante="primary" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {disponibles.map((p) => {
              const cuenta = cuentas.find((c) => c.platform === p);
              return (
                <label key={p} className="flex items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
                  <input
                    type="checkbox"
                    checked={platforms.includes(p)}
                    onChange={() => toggle(p)}
                    className="h-4 w-4 accent-[var(--crm-accent-strong)]"
                  />
                  {PLATFORM_LABEL[p] ?? p}
                  {cuenta?.username && (
                    <span className="text-[12px] text-[var(--crm-ink-faint)]">{cuenta.username}</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "220ms" }}>
        <SectionHeader title="Cuándo se publica" className="mb-4" />
        <div className="max-w-[280px]">
          <label className={label} htmlFor="cuando">
            Fecha y hora (opcional)
          </label>
          <input
            id="cuando"
            type="datetime-local"
            value={cuando}
            onChange={(e) => setCuando(e.target.value)}
            className="crm-input crm-num"
          />
        </div>
        <p className={hint}>
          {fechaOk
            ? `Escribes la hora de este equipo. En Yucatán sale el ${fmtFecha(new Date(cuando))}.`
            : "Vacío significa publicar de inmediato al aprobar."}
        </p>
      </section>

      {error && (
        <p className="crm-card border-[var(--destructive)] p-3 text-[13px] text-[var(--destructive)]">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={guardar} disabled={pending} className="crm-btn crm-btn-secondary">
          {pending ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <Save className="size-4" strokeWidth={2} />}
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={abrirConfirmacion}
          disabled={pending || disponibles.length === 0}
          className="crm-btn crm-btn-primary"
        >
          <Send className="size-4" strokeWidth={2} />
          {fechaOk ? "Aprobar y programar" : "Aprobar y publicar ya"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmando}
        onClose={() => setConfirmando(false)}
        onConfirm={aprobar}
        title={fechaOk ? "Programar el post" : "Publicar ahora"}
        description={
          fechaOk
            ? `${comoSale} Sale solo en ${listaPlataformas(platforms)} el ${fmtFecha(new Date(cuando))}, hora de Yucatán. Después de esto ya no se puede editar desde aquí.`
            : `${comoSale} Se publica de inmediato en ${listaPlataformas(platforms)}. Después de esto ya no se puede editar desde aquí.`
        }
        confirmLabel={fechaOk ? "Programar" : "Publicar ahora"}
        pending={pending}
      />

      <ImageWorkspace
        open={editandoImagen}
        src={imageUrl}
        onClose={() => setEditandoImagen(false)}
        onGuardar={guardarImagen}
      />
    </div>
  );
}

// `datetime-local` trabaja en hora local del navegador: se convierte a mano porque
// toISOString() daría UTC y el input mostraría otra hora.
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

function listaPlataformas(platforms: string[]): string {
  return platforms.map((p) => PLATFORM_LABEL[p] ?? p).join(" y ");
}
