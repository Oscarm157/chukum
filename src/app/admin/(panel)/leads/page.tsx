import Link from "next/link";
import { getLeads, getLeadCounts } from "@/lib/leads-data";
import type { LeadStatus, LeadSource } from "@/lib/schema";
import { PageHeader } from "@/components/crm/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads", robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  enviado_crm: "Enviado a CRM",
  cerrado: "Cerrado",
};
const SOURCE_LABEL: Record<string, string> = { form: "Formulario", whatsapp: "WhatsApp", manual: "Manual" };
const STATUS_FILTERS = ["nuevo", "contactado", "enviado_crm", "cerrado"] as const;

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d) : "—";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUS_FILTERS.includes(sp.status as (typeof STATUS_FILTERS)[number]) ? (sp.status as LeadStatus) : undefined;
  const source = ["form", "whatsapp", "manual"].includes(sp.source ?? "") ? (sp.source as LeadSource) : undefined;

  const [items, counts] = await Promise.all([getLeads({ status, source }), getLeadCounts()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Comercial"
        title="Leads"
        description="Contactos que llegan del sitio. Cambia el estatus conforme los atiendes."
      />

      {/* Filtros por estatus */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin/leads" className={`crm-btn crm-btn-sm ${!status ? "crm-btn-primary" : "crm-btn-secondary"}`}>
          Todos <span className="crm-num ml-1 opacity-70">{total}</span>
        </Link>
        {STATUS_FILTERS.map((s) => (
          <Link key={s} href={`/admin/leads?status=${s}`} className={`crm-btn crm-btn-sm ${status === s ? "crm-btn-primary" : "crm-btn-secondary"}`}>
            {STATUS_LABEL[s]} <span className="crm-num ml-1 opacity-70">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="crm-empty px-6 py-20">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">No hay leads con este filtro.</p>
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          <table className="crm-table">
            <thead className="crm-thead">
              <tr>
                <th className="crm-th">Contacto</th>
                <th className="crm-th">Origen</th>
                <th className="crm-th">Interés</th>
                <th className="crm-th">Estatus</th>
                <th className="crm-th text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => (
                <tr key={l.id} className="crm-row crm-fade border-t border-[var(--crm-line)]" style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
                  <td className="crm-td">
                    <Link href={`/admin/leads/${l.id}`} className="font-medium text-[var(--crm-ink)] transition-colors hover:text-[var(--crm-accent-strong)]">
                      {l.name ?? l.email ?? l.phone ?? "Lead"}
                    </Link>
                    {l.email && <span className="ml-2 text-[12px] text-[var(--crm-ink-faint)]">{l.email}</span>}
                  </td>
                  <td className="crm-td text-[13px] text-[var(--crm-ink-soft)]">{SOURCE_LABEL[l.source] ?? l.source}</td>
                  <td className="crm-td text-[13px] text-[var(--crm-ink-soft)]">{l.developmentSlug ?? l.zonaSlug ?? "—"}</td>
                  <td className="crm-td"><span className="crm-badge">{STATUS_LABEL[l.status] ?? l.status}</span></td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-mute)]">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
