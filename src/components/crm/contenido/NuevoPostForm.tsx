"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Crop, Type } from "lucide-react";
import type { DesarrolloOption } from "@/lib/contenido-data";
import { generarBorrador } from "@/app/admin/(panel)/contenido/actions";
import { SectionHeader } from "@/components/crm/PageShell";
import { ImageCropper } from "@/components/crm/contenido/ImageCropper";
import { TextOverlayEditor } from "@/components/crm/contenido/TextOverlayEditor";

const label = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";
const hint = "mt-1.5 text-[12px] leading-snug text-[var(--crm-ink-mute)]";

type Fuente = "desarrollo" | "libre";

const FUENTES: { v: Fuente; label: string }[] = [
  { v: "desarrollo", label: "Desarrollo del catálogo" },
  { v: "libre", label: "Tema libre" },
];

export function NuevoPostForm({ desarrollos }: { desarrollos: DesarrolloOption[] }) {
  const router = useRouter();
  const [fuente, setFuente] = useState<Fuente>("desarrollo");
  const [developmentId, setDevelopmentId] = useState("");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [recortando, setRecortando] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const [formato, setFormato] = useState<string | null>(null);
  const [conTexto, setConTexto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const conFotos = desarrollos.filter((d) => d.imageCount > 0);

  function elegirArchivo(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setError(null);
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  // El recorte reemplaza el archivo que se va a subir: lo que se guarda es la versión
  // recortada, no la original.
  function aplicarRecorte(f: File, ratio: string) {
    reemplazarImagen(f);
    setFormato(ratio);
    setRecortando(false);
  }

  // El overlay también trabaja sobre el archivo local: se sube ya aplanado con el texto.
  function aplicarTexto(f: File) {
    reemplazarImagen(f);
    setConTexto(true);
    setEscribiendo(false);
  }

  function reemplazarImagen(f: File) {
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (fuente === "desarrollo" && !developmentId) {
      setError("Elige un desarrollo.");
      return;
    }
    if (fuente === "libre" && !topic.trim()) {
      setError("Escribe de qué trata el post.");
      return;
    }
    if (fuente === "libre" && !file) {
      setError("Sube la imagen que va a acompañar el post.");
      return;
    }

    start(async () => {
      const res = await generarBorrador(
        fuente === "desarrollo"
          ? { sourceType: "desarrollo", developmentId }
          : { sourceType: "libre", topic: topic.trim(), imageFile: file! }
      );
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(`/admin/contenido/${res.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <section className="crm-card crm-fade p-6" style={{ animationDelay: "0ms" }}>
        <SectionHeader title="De dónde sale el post" className="mb-4" />
        <div role="radiogroup" aria-label="Fuente del post" className="flex flex-wrap gap-2">
          {FUENTES.map((o) => (
            <label
              key={o.v}
              className="crm-tab cursor-pointer focus-within:ring-2 focus-within:ring-[var(--crm-accent-ring)]"
              data-active={fuente === o.v}
            >
              <input
                type="radio"
                name="fuente"
                value={o.v}
                checked={fuente === o.v}
                onChange={() => {
                  setFuente(o.v);
                  setError(null);
                }}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>

        {fuente === "desarrollo" ? (
          <div className="mt-5 max-w-[420px]">
            <label className={label} htmlFor="developmentId">
              Desarrollo
            </label>
            <select
              id="developmentId"
              className="crm-select"
              value={developmentId}
              onChange={(e) => setDevelopmentId(e.target.value)}
            >
              <option value="">Elige uno</option>
              {conFotos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.city ? ` · ${d.city}` : ""}
                </option>
              ))}
            </select>
            <p className={hint}>
              El caption se escribe solo con lo que está guardado en la ficha (ubicación, descripción, amenidades) y usa
              la foto de portada. No se inventan precios ni plazos.
            </p>
            {conFotos.length === 0 && (
              <p className="mt-2 text-[12.5px] text-[var(--destructive)]">
                {desarrollos.length === 0
                  ? "El catálogo está vacío. Da de alta un desarrollo antes de generar el post."
                  : "Ningún desarrollo tiene fotos cargadas. Sube al menos una en Catálogo antes de generar el post."}
              </p>
            )}
            {conFotos.length < desarrollos.length && conFotos.length > 0 && (
              <p className={hint}>
                {desarrollos.length - conFotos.length} desarrollo(s) no aparecen aquí porque no tienen fotos.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            <div>
              <label className={label} htmlFor="topic">
                De qué trata
              </label>
              <textarea
                id="topic"
                rows={3}
                maxLength={500}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="crm-textarea"
                placeholder="Cómo funciona el crédito Infonavit para un terreno en Yucatán."
              />
              <p className={hint}>
                <span className="crm-num">{topic.length}</span>/500. Entre más concreto el brief, menos genérico sale el
                caption.
              </p>
            </div>

            <div>
              <label className={label}>Imagen</label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) elegirArchivo(f);
                }}
                onClick={() => !pending && inputRef.current?.click()}
                data-accepts="true"
                data-over={dragOver || undefined}
                className="crm-dropzone flex min-h-[96px] cursor-pointer flex-col items-center justify-center p-4 text-center"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) elegirArchivo(f);
                  }}
                />
                {preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="" className="max-h-40 rounded-lg object-contain" />
                    <p className="mt-2 text-[11.5px] text-[var(--crm-ink-mute)]">
                      {file?.name} · haz clic para cambiarla
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[12.5px] font-medium text-[var(--crm-ink-soft)]">
                      Arrastra una imagen o haz clic
                    </p>
                    <p className="mt-1 text-[11.5px] text-[var(--crm-ink-mute)]">JPG, PNG o WebP · máx 8MB</p>
                  </>
                )}
              </div>
              {preview && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <button
                    type="button"
                    onClick={() => setRecortando(true)}
                    className="crm-btn crm-btn-sm crm-btn-secondary"
                  >
                    <Crop className="size-3.5" strokeWidth={2} />
                    Recortar imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscribiendo(true)}
                    className="crm-btn crm-btn-sm crm-btn-secondary"
                  >
                    <Type className="size-3.5" strokeWidth={2} />
                    Agregar texto
                  </button>
                  <p className="text-[12px] text-[var(--crm-ink-mute)]">
                    {formato ? (
                      <>
                        Recortada a <span className="crm-num">{formato}</span>.
                      </>
                    ) : (
                      "Sin recortar se sube con las proporciones originales."
                    )}
                    {conTexto && " Con texto aplicado."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {error && (
        <p className="crm-card border-[var(--destructive)] p-3 text-[13px] text-[var(--destructive)]">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || (fuente === "desarrollo" && conFotos.length === 0)}
          className="crm-btn crm-btn-primary"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          ) : (
            <Sparkles className="size-4" strokeWidth={2} />
          )}
          {pending ? "Escribiendo el borrador…" : "Generar borrador"}
        </button>
        <p className="text-[12.5px] text-[var(--crm-ink-mute)]">
          {pending
            ? "Tarda unos segundos. No cierres esta pestaña."
            : "Genera un borrador editable. No se publica nada todavía."}
        </p>
      </div>

      {preview && (
        <>
          <ImageCropper
            open={recortando}
            src={preview}
            onClose={() => setRecortando(false)}
            onAplicar={aplicarRecorte}
          />
          <TextOverlayEditor
            open={escribiendo}
            src={preview}
            onClose={() => setEscribiendo(false)}
            onAplicar={aplicarTexto}
          />
        </>
      )}
    </form>
  );
}
