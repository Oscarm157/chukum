import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@/lib/leads-data";
import { LeadStatusControl } from "@/components/crm/leads/LeadStatusControl";
import { SectionHeader } from "@/components/crm/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lead", robots: { index: false } };

const SOURCE_LABEL: Record<string, string> = { form: "Formulario", whatsapp: "WhatsApp", manual: "Manual" };
const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(d) : "—";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--crm-line)] px-4 py-3 last:border-0">
      <p className="text-[12px] font-medium text-[var(--crm-ink-mute)]">{label}</p>
      <p className="mt-0.5 text-[13.5px] text-[var(--crm-ink)]">{value || "—"}</p>
    </div>
  );
}

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--crm-ink-mute)] transition-colors hover:text-[var(--crm-ink)]">
          <span aria-hidden>&larr;</span> Leads
        </Link>
        <LeadStatusControl id={lead.id} status={lead.status} />
      </div>

      <div className="crm-fade mb-6">
        <h1 className="crm-h1">{lead.name ?? lead.email ?? lead.phone ?? "Lead"}</h1>
        <p className="mt-2 text-[13px] text-[var(--crm-ink-mute)]">
          {SOURCE_LABEL[lead.source] ?? lead.source} · {fmtDate(lead.createdAt)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="crm-card overflow-hidden p-0">
          <SectionHeader title="Contacto" className="px-4 pt-3" />
          <Field label="Correo" value={lead.email} />
          <Field label="Teléfono" value={lead.phone} />
          <Field label="Idioma" value={lead.locale} />
        </div>
        <div className="crm-card overflow-hidden p-0">
          <SectionHeader title="Atribución" className="px-4 pt-3" />
          <Field label="Desarrollo" value={lead.developmentSlug} />
          <Field label="Zona" value={lead.zonaSlug} />
          <Field label="Página de origen" value={lead.sourceUrl} />
          <Field label="Campaña (UTM)" value={lead.utmCampaign} />
        </div>
      </div>

      <div className="crm-card mt-4 p-5">
        <SectionHeader title="Mensaje" className="mb-3" />
        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--crm-ink-soft)]">{lead.message || "Sin mensaje."}</p>
      </div>
    </div>
  );
}
