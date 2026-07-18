import type { Zona } from "@/lib/schema";
import { SectionHeader } from "@/components/crm/PageShell";

const label = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";
const hint = "mt-1.5 text-[12px] leading-snug text-[var(--crm-ink-mute)]";

export function ZonaForm({
  zona,
  action,
  submitLabel,
}: {
  zona?: Zona;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="crm-card crm-fade p-6" style={{ animationDelay: "0ms" }}>
        <SectionHeader title="Identificación" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="nombre">Nombre de la zona</label>
            <input id="nombre" name="nombre" required defaultValue={zona?.nombre ?? ""} className="crm-input" placeholder="Mérida norte" />
          </div>
          <div>
            <label className={label} htmlFor="slug">Slug</label>
            <input id="slug" name="slug" required defaultValue={zona?.slug ?? ""} className="crm-input" placeholder="merida-norte" />
            <p className={hint}>Alimenta /vivir-en-merida/zonas/[slug]. Único.</p>
          </div>
          <div className="flex items-center gap-5 sm:col-span-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
              <input type="checkbox" name="publicada" defaultChecked={zona?.publicada ?? false} className="accent-[var(--crm-accent)]" />
              Publicada (visible en el sitio)
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
              <input type="checkbox" name="verified" defaultChecked={zona?.verified ?? false} className="accent-[var(--crm-accent)]" />
              Datos verificados
            </label>
          </div>
        </div>
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "55ms" }}>
        <SectionHeader title="Contenido" className="mb-4" />
        <div className="grid gap-4">
          <div>
            <label className={label} htmlFor="descripcionEs">Descripción (ES)</label>
            <textarea id="descripcionEs" name="descripcionEs" rows={3} defaultValue={zona?.descripcionEs ?? ""} className="crm-textarea" />
          </div>
          <div>
            <label className={label} htmlFor="descripcionEn">Descripción (EN, opcional)</label>
            <textarea id="descripcionEn" name="descripcionEn" rows={2} defaultValue={zona?.descripcionEn ?? ""} className="crm-textarea" />
          </div>
          <div>
            <label className={label} htmlFor="perfilComprador">Perfil del comprador</label>
            <input id="perfilComprador" name="perfilComprador" defaultValue={zona?.perfilComprador ?? ""} className="crm-input" placeholder="Familias, inversión, retiro" />
          </div>
          <div>
            <label className={label} htmlFor="amenidades">Amenidades / atractivos (separadas por coma)</label>
            <input id="amenidades" name="amenidades" defaultValue={(zona?.amenidades ?? []).join(", ")} className="crm-input" placeholder="Escuelas, plazas, ciclovía" />
          </div>
        </div>
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "110ms" }}>
        <SectionHeader title="Datos y ubicación" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="precioM2Mxn">Precio por m² (MXN)</label>
            <input id="precioM2Mxn" name="precioM2Mxn" inputMode="numeric" defaultValue={zona?.precioM2Mxn ?? ""} className="crm-input crm-num" />
          </div>
          <div>
            <label className={label} htmlFor="plusvaliaAnual">Plusvalía anual (%)</label>
            <input id="plusvaliaAnual" name="plusvaliaAnual" inputMode="decimal" defaultValue={zona?.plusvaliaAnual ?? ""} className="crm-input crm-num" placeholder="8.5" />
          </div>
          <div>
            <label className={label} htmlFor="lat">Latitud</label>
            <input id="lat" name="lat" inputMode="decimal" defaultValue={zona?.lat ?? ""} className="crm-input crm-num" />
          </div>
          <div>
            <label className={label} htmlFor="lng">Longitud</label>
            <input id="lng" name="lng" inputMode="decimal" defaultValue={zona?.lng ?? ""} className="crm-input crm-num" />
          </div>
        </div>
      </section>

      <div>
        <button type="submit" className="crm-btn crm-btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
