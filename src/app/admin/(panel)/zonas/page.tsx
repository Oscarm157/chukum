import Link from "next/link";
import { getZonas } from "@/lib/zonas-data";
import { PageHeader } from "@/components/crm/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Zonas", robots: { index: false } };

export default async function ZonasPage() {
  const items = await getZonas();
  const publicadas = items.filter((z) => z.publicada).length;

  const kpis = [
    { label: "Zonas", value: String(items.length) },
    { label: "Publicadas", value: String(publicadas), accent: true },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Contenido"
        title="Zonas"
        description="Contenido SEO de Vivir en Yucatán: una página por zona. Solo las publicadas salen al sitio."
        actions={<Link href="/admin/zonas/nueva" className="crm-btn crm-btn-primary">Nueva zona</Link>}
      />

      <div className="crm-card mb-6 overflow-hidden p-0">
        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--crm-line)" }}>
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
          <p className="text-[14px] text-[var(--crm-ink-soft)]">Aún no hay zonas.</p>
          <Link href="/admin/zonas/nueva" className="crm-btn crm-btn-secondary crm-btn-sm mt-4">Crear la primera</Link>
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          <table className="crm-table">
            <thead className="crm-thead">
              <tr>
                <th className="crm-th">Zona</th>
                <th className="crm-th text-right">Precio m²</th>
                <th className="crm-th text-right">Desarrollos</th>
                <th className="crm-th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((z, i) => (
                <tr key={z.id} className="crm-row crm-fade border-t border-[var(--crm-line)]" style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                  <td className="crm-td">
                    <Link href={`/admin/zonas/${z.id}`} className="font-medium text-[var(--crm-ink)] transition-colors hover:text-[var(--crm-accent-strong)]">{z.nombre}</Link>
                    <span className="crm-num ml-2 text-[12px] text-[var(--crm-ink-faint)]">/{z.slug}</span>
                  </td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                    {z.precioM2Mxn ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(z.precioM2Mxn) : "—"}
                  </td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink)]">{z.devCount}</td>
                  <td className="crm-td">
                    <span className={`crm-badge ${z.publicada ? "crm-badge-wine" : ""}`}>{z.publicada ? "Publicada" : "Borrador"}</span>
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
