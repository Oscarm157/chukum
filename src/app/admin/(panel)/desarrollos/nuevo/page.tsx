import Link from "next/link";
import { getZonaOptions } from "@/lib/desarrollos-data";
import { createDesarrollo } from "../actions";
import { DesarrolloForm } from "@/components/crm/desarrollos/DesarrolloForm";
import { PageHeader } from "@/components/crm/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo desarrollo", robots: { index: false } };

export default async function NuevoDesarrollo({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const zonaOptions = await getZonaOptions();

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-5">
        <Link href="/admin/desarrollos" className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--crm-ink-mute)] transition-colors hover:text-[var(--crm-ink)]">
          <span aria-hidden>&larr;</span> Desarrollos
        </Link>
      </div>
      <PageHeader eyebrow="Catálogo" title="Nuevo desarrollo" />
      {error && (
        <p className="crm-card mb-4 border-[var(--destructive)] p-3 text-[13px] text-[var(--destructive)]">{error}</p>
      )}
      <DesarrolloForm zonaOptions={zonaOptions} action={createDesarrollo} submitLabel="Crear desarrollo" />
    </div>
  );
}
