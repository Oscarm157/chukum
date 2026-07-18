import Link from "next/link";
import { getDesarrollos } from "@/lib/desarrollos-data";
import { PageHeader } from "@/components/crm/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Desarrollos", robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  preventa: "Preventa",
  en_construccion: "En construcción",
  entrega_inmediata: "Entrega inmediata",
  vendido: "Vendido",
};

export default async function DesarrollosPage() {
  const items = await getDesarrollos();
  const conModelos = items.filter((d) => d.unitCount > 0).length;

  const kpis = [
    { label: "Desarrollos", value: String(items.length) },
    { label: "Con modelos", value: String(conModelos) },
    { label: "Verificados", value: String(items.filter((d) => d.verified).length), accent: true },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Catálogo"
        title="Desarrollos"
        description="Alta y edición de los desarrollos que Chukum comercializa: info, modelos y fotos."
        actions={<Link href="/admin/desarrollos/nuevo" className="crm-btn crm-btn-primary">Nuevo desarrollo</Link>}
      />

      <div className="crm-card mb-6 overflow-hidden p-0">
        <div className="grid grid-cols-3 gap-px" style={{ background: "var(--crm-line)" }}>
          {kpis.map((k, i) => (
            <div key={k.label} className="crm-fade flex min-h-[100px] flex-col justify-between p-4" style={{ background: "var(--crm-surface-2)", animationDelay: `${i * 55}ms` }}>
              <p className="text-[12px] font-medium" style={{ color: "var(--crm-ink-mute)" }}>{k.label}</p>
              <span className="crm-num font-semibold text-[27px] leading-none tracking-[-0.025em]" style={{ color: k.accent ? "var(--crm-accent-strong)" : "var(--crm-ink)" }}>{k.value}</span>
            </div>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="crm-empty px-6 py-20">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">Aún no hay desarrollos.</p>
          <Link href="/admin/desarrollos/nuevo" className="crm-btn crm-btn-secondary crm-btn-sm mt-4">Crear el primero</Link>
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          <table className="crm-table">
            <thead className="crm-thead">
              <tr>
                <th className="crm-th">Desarrollo</th>
                <th className="crm-th">Ciudad</th>
                <th className="crm-th">Etapa</th>
                <th className="crm-th text-right">Modelos</th>
                <th className="crm-th text-right">Fotos</th>
                <th className="crm-th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d, i) => (
                <tr key={d.id} className="crm-row crm-fade border-t border-[var(--crm-line)]" style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                  <td className="crm-td">
                    <Link href={`/admin/desarrollos/${d.id}`} className="font-medium text-[var(--crm-ink)] transition-colors hover:text-[var(--crm-accent-strong)]">
                      {d.name}
                    </Link>
                    <span className="crm-num ml-2 text-[12px] text-[var(--crm-ink-faint)]">/{d.slug}</span>
                  </td>
                  <td className="crm-td text-[13px] text-[var(--crm-ink-soft)]">{d.city ?? "—"}</td>
                  <td className="crm-td text-[13px] text-[var(--crm-ink-soft)]">{d.statusMarketing ? STATUS_LABEL[d.statusMarketing] : "—"}</td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink)]">{d.unitCount}</td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">{d.imageCount}</td>
                  <td className="crm-td">
                    <span className={`crm-badge ${d.verified ? "crm-badge-wine" : ""}`}>{d.verified ? "Verificado" : "Borrador"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
