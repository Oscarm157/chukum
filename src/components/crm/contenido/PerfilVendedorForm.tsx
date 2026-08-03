"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, UserRound } from "lucide-react";
import { guardarPerfilVendedor } from "@/app/admin/(panel)/contenido/perfil-actions";
import { SectionHeader } from "@/components/crm/PageShell";

const label = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";
const hint = "mt-1.5 text-[12px] leading-snug text-[var(--crm-ink-mute)]";

export function PerfilVendedorForm({
  perfil,
}: {
  /** Perfil activo ya guardado, o null la primera vez. */
  perfil: { name: string; phone: string | null; photoUrl: string | null } | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(perfil?.name ?? "");
  const [phone, setPhone] = useState(perfil?.phone ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(perfil?.photoUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function elegirArchivo(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setError(null);
    setGuardado(false);
    setFile(f);
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardado(false);

    if (!name.trim()) {
      setError("Escribe tu nombre.");
      return;
    }

    start(async () => {
      const res = await guardarPerfilVendedor({
        name: name.trim(),
        phone: phone.trim(),
        ...(file ? { photoFile: file } : {}),
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setFile(null);
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <section className="crm-card crm-fade p-6" style={{ animationDelay: "0ms" }}>
        <SectionHeader title="Datos de la firma" className="mb-4" />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <span className={label}>Foto</span>
            <button
              type="button"
              onClick={() => !pending && inputRef.current?.click()}
              className="block size-[84px] overflow-hidden rounded-full border border-[var(--crm-line)] bg-[var(--crm-surface)] transition-opacity hover:opacity-80"
              aria-label={preview ? "Cambiar la foto" : "Subir una foto"}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[var(--crm-ink-faint)]">
                  <UserRound className="size-7" strokeWidth={1.6} />
                </span>
              )}
            </button>
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
            <p className="mt-2 max-w-[140px] text-[12px] leading-snug text-[var(--crm-ink-mute)]">
              {preview ? "Haz clic para cambiarla." : "JPG o PNG. Se recorta en círculo."}
            </p>
          </div>

          <div className="grid flex-1 gap-4 sm:max-w-[420px]">
            <div>
              <label className={label} htmlFor="perfil-name">
                Nombre
              </label>
              <input
                id="perfil-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setGuardado(false);
                }}
                maxLength={80}
                className="crm-input"
                placeholder="Oscar Amayoral"
              />
            </div>
            <div>
              <label className={label} htmlFor="perfil-phone">
                Teléfono o WhatsApp
              </label>
              <input
                id="perfil-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setGuardado(false);
                }}
                maxLength={40}
                className="crm-input"
                placeholder="999 123 4567"
              />
              <p className={hint}>Sale debajo del nombre en la firma. Déjalo vacío si no quieres mostrarlo.</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p className="crm-card border-[var(--destructive)] p-3 text-[13px] text-[var(--destructive)]">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="crm-btn crm-btn-primary">
          {pending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          ) : (
            <Save className="size-4" strokeWidth={2} />
          )}
          Guardar perfil
        </button>
        <p className="text-[12.5px] text-[var(--crm-ink-mute)]">
          {guardado ? "Perfil guardado." : "La firma toma estos datos cada vez que la activas en un post."}
        </p>
      </div>
    </form>
  );
}
