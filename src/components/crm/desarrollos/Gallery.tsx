"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Star, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { DevelopmentImage } from "@/lib/schema";
import { ConfirmDialog } from "@/components/crm/ConfirmDialog";
import {
  uploadDesarrolloImage,
  deleteDesarrolloImage,
  setHeroImage,
  reorderImages,
} from "@/app/admin/(panel)/desarrollos/actions";

export function Gallery({ devId, images }: { devId: string; images: DevelopmentImage[] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<DevelopmentImage | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadDesarrolloImage(devId, fd);
      if ("error" in res) setError(res.error);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    const ids = images.map((i) => i.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    start(() => reorderImages(devId, ids));
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        data-accepts="true"
        data-over={dragOver || undefined}
        className="crm-dropzone mb-4 flex min-h-[96px] cursor-pointer flex-col items-center justify-center p-4 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
        {uploading ? (
          <span className="flex items-center gap-2 text-[12.5px] text-[var(--crm-ink-soft)]">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Subiendo…
          </span>
        ) : (
          <>
            <p className="text-[12.5px] font-medium text-[var(--crm-ink-soft)]">Arrastra una imagen o haz clic</p>
            <p className="mt-1 text-[11.5px] text-[var(--crm-ink-mute)]">JPG, PNG o WebP · máx 8MB</p>
          </>
        )}
      </div>

      {error && <p className="mb-3 text-[12px] text-[var(--destructive)]">{error}</p>}

      {images.length === 0 ? (
        <div className="crm-card p-6 text-[13px] text-[var(--crm-ink-mute)]">Aún no hay fotos. La primera que subas queda como portada.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={img.id} className="crm-card overflow-hidden p-0">
              <div className="relative aspect-[4/3] bg-[var(--crm-surface)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                {img.kind === "hero" && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--crm-accent)] px-2 py-0.5 text-[11px] font-medium text-black">
                    <Star className="size-3" strokeWidth={2.4} /> Portada
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex items-center gap-1">
                  <button type="button" disabled={pending || i === 0} onClick={() => move(i, -1)} className="crm-btn crm-btn-ghost crm-btn-sm" aria-label="Subir">
                    <ArrowUp className="size-3.5" strokeWidth={2} />
                  </button>
                  <button type="button" disabled={pending || i === images.length - 1} onClick={() => move(i, 1)} className="crm-btn crm-btn-ghost crm-btn-sm" aria-label="Bajar">
                    <ArrowDown className="size-3.5" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {img.kind !== "hero" && (
                    <button type="button" disabled={pending} onClick={() => start(() => setHeroImage(devId, img.id))} className="crm-btn crm-btn-ghost crm-btn-sm" aria-label="Marcar como portada">
                      <Star className="size-3.5" strokeWidth={2} />
                    </button>
                  )}
                  <button type="button" onClick={() => setDeleting(img)} className="crm-btn crm-btn-ghost crm-btn-sm" aria-label="Borrar foto">
                    <Trash2 className="size-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const id = deleting?.id;
          if (!id) return;
          start(async () => {
            await deleteDesarrolloImage(devId, id);
            setDeleting(null);
          });
        }}
        title="Borrar foto"
        description="Se elimina la foto de forma permanente."
        confirmLabel="Borrar foto"
        destructive
        pending={pending}
      />
    </div>
  );
}
