import Link from "next/link";
import { createZona } from "../actions";
import { ZonaForm } from "@/components/crm/zonas/ZonaForm";
import { PageHeader } from "@/components/crm/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nueva zona", robots: { index: false } };

export default async function NuevaZona({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-5">
        <Link href="/admin/zonas" className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--crm-ink-mute)] transition-colors hover:text-[var(--crm-ink)]">
          <span aria-hidden>&larr;</span> Zonas
        </Link>
      </div>
      <PageHeader eyebrow="Contenido" title="Nueva zona" />
      {error && <p className="crm-card mb-4 border-[var(--destructive)] p-3 text-[13px] text-[var(--destructive)]">{error}</p>}
      <ZonaForm action={createZona} submitLabel="Crear zona" />
    </div>
  );
}
