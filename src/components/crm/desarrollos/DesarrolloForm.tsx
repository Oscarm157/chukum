import type { Development } from "@/lib/schema";
import { SectionHeader } from "@/components/crm/PageShell";

const label = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";
const hint = "mt-1.5 text-[12px] leading-snug text-[var(--crm-ink-mute)]";

const MACRO_ZONAS = [
  ["merida", "Mérida ciudad"],
  ["costa", "Costa de Yucatán"],
  ["caribe", "Caribe, Quintana Roo"],
  ["selva", "Selva maya"],
] as const;
const STATUSES = [
  ["preventa", "Preventa"],
  ["en_construccion", "En construcción"],
  ["entrega_inmediata", "Entrega inmediata"],
  ["vendido", "Vendido"],
] as const;
const TIPOS = [
  ["terreno", "Terreno"],
  ["casa", "Casa"],
  ["departamento", "Departamento"],
  ["townhouse", "Townhouse"],
  ["local_comercial", "Local comercial"],
] as const;
const USOS = [
  ["invertir", "Invertir"],
  ["vivir", "Vivir"],
] as const;

function Check({
  name,
  value,
  children,
  checked,
}: {
  name: string;
  value: string;
  children: React.ReactNode;
  checked: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--crm-r-sm,7px)] border border-[var(--crm-line)] bg-[var(--crm-surface-2)] px-3 py-1.5 text-[13px] text-[var(--crm-ink-soft)]">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="accent-[var(--crm-accent)]" />
      {children}
    </label>
  );
}

export function DesarrolloForm({
  dev,
  zonaOptions,
  action,
  submitLabel,
}: {
  dev?: Development;
  zonaOptions: { id: string; nombre: string }[];
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const v = dev;
  const specs = v?.highlightSpecs ?? [];

  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="crm-card crm-fade p-6" style={{ animationDelay: "0ms" }}>
        <SectionHeader title="Identificación" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="name">Nombre del proyecto</label>
            <input id="name" name="name" required defaultValue={v?.name ?? ""} className="crm-input" />
            <p className={hint}>Uso interno y páginas de zona. No aparece en el home (restricción legal).</p>
          </div>
          <div>
            <label className={label} htmlFor="slug">Slug</label>
            <input id="slug" name="slug" required defaultValue={v?.slug ?? ""} className="crm-input" placeholder="xook" />
            <p className={hint}>Minúsculas, números y guiones. Debe ser único.</p>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="heading">Encabezado del home</label>
            <input id="heading" name="heading" defaultValue={v?.heading ?? ""} className="crm-input" placeholder="En la selva de Yucatán" />
            <p className={hint}>Título de la card pública, SIN nombre de proyecto.</p>
          </div>
          <div>
            <label className={label} htmlFor="statusMarketing">Etapa</label>
            <select id="statusMarketing" name="statusMarketing" defaultValue={v?.statusMarketing ?? "preventa"} className="crm-select">
              {STATUSES.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
              <input type="checkbox" name="verified" defaultChecked={v?.verified ?? false} className="accent-[var(--crm-accent)]" />
              Datos verificados por Oscar
            </label>
          </div>
        </div>
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "55ms" }}>
        <SectionHeader title="Ubicación" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="macroZona">Macro-zona (filtro del home)</label>
            <select id="macroZona" name="macroZona" defaultValue={v?.macroZona ?? "merida"} className="crm-select">
              {MACRO_ZONAS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="city">Ciudad (pill del home)</label>
            <input id="city" name="city" defaultValue={v?.city ?? ""} className="crm-input" placeholder="Mérida" />
          </div>
          <div>
            <label className={label} htmlFor="state">Estado</label>
            <input id="state" name="state" defaultValue={v?.state ?? ""} className="crm-input" placeholder="Yucatán" />
          </div>
          <div>
            <label className={label} htmlFor="zonaId">Zona SEO (opcional)</label>
            <select id="zonaId" name="zonaId" defaultValue={v?.zonaId ?? ""} className="crm-select">
              <option value="">Sin enlazar</option>
              {zonaOptions.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "110ms" }}>
        <SectionHeader title="Tipos y usos" className="mb-4" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className={label}>Tipos de propiedad</span>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map(([val, l]) => (
                <Check key={val} name="propertyTypes" value={val} checked={v?.propertyTypes?.includes(val) ?? false}>{l}</Check>
              ))}
            </div>
          </div>
          <div>
            <span className={label}>Usos (quiz del home)</span>
            <div className="flex flex-wrap gap-2">
              {USOS.map(([val, l]) => (
                <Check key={val} name="usos" value={val} checked={v?.usos?.includes(val) ?? false}>{l}</Check>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "165ms" }}>
        <SectionHeader title="Descripción" className="mb-4" />
        <div className="grid gap-4">
          <div>
            <label className={label} htmlFor="descriptionEs">Descripción (blurb del home)</label>
            <textarea id="descriptionEs" name="descriptionEs" rows={3} defaultValue={v?.descriptionEs ?? ""} className="crm-textarea" />
          </div>
          <div>
            <label className={label} htmlFor="descriptionEn">Descripción en inglés (opcional)</label>
            <textarea id="descriptionEn" name="descriptionEn" rows={2} defaultValue={v?.descriptionEn ?? ""} className="crm-textarea" />
          </div>
          <div>
            <label className={label} htmlFor="amenities">Amenidades (separadas por coma)</label>
            <input id="amenities" name="amenities" defaultValue={(v?.amenities ?? []).join(", ")} className="crm-input" placeholder="Casa club, alberca, cenote" />
          </div>
        </div>
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "220ms" }}>
        <SectionHeader title="Datos destacados del home (opcional)" className="mb-1" />
        <p className={hint} style={{ marginBottom: "1rem" }}>Hasta 3 bullets curados, ej. &quot;Aparta con&quot; · &quot;$10,000 MXN&quot;.</p>
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-2">
              <input name={`specLabel${i}`} defaultValue={specs[i]?.label ?? ""} className="crm-input" placeholder="Etiqueta" />
              <input name={`specValue${i}`} defaultValue={specs[i]?.value ?? ""} className="crm-input" placeholder="Valor" />
            </div>
          ))}
        </div>
      </section>

      <section className="crm-card crm-fade p-6" style={{ animationDelay: "275ms" }}>
        <SectionHeader title="Fuentes (opcional)" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="sourceUrlEs">URL de origen (ES)</label>
            <input id="sourceUrlEs" name="sourceUrlEs" defaultValue={v?.sourceUrlEs ?? ""} className="crm-input" placeholder="https://" />
          </div>
          <div>
            <label className={label} htmlFor="sourceUrlEn">URL de origen (EN)</label>
            <input id="sourceUrlEn" name="sourceUrlEn" defaultValue={v?.sourceUrlEn ?? ""} className="crm-input" placeholder="https://" />
          </div>
        </div>
      </section>

      <div>
        <button type="submit" className="crm-btn crm-btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
