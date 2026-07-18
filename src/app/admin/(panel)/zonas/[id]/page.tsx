import Link from "next/link";
import { notFound } from "next/navigation";
import { getZonaById } from "@/lib/zonas-data";
import { updateZona } from "../actions";
import { ZonaForm } from "@/components/crm/zonas/ZonaForm";
import { DeleteZonaButton } from "@/components/crm/zonas/DeleteZonaButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar zona", robots: { index: false } };

export default async function ZonaDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const zona = await getZonaById(id);
  if (!zona) notFound();

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/zonas" className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--crm-ink-mute)] transition-colors hover:text-[var(--crm-ink)]">
          <span aria-hidden>&larr;</span> Zonas
        </Link>
        <DeleteZonaButton id={zona.id} />
      </div>

      <div className="crm-fade mb-6">
        <h1 className="crm-h1">{zona.nombre}</h1>
        <p className="mt-2 crm-num text-[13px] text-[var(--crm-ink-mute)]">/{zona.slug}</p>
      </div>

      {error && <p className="crm-card mb-4 border-[var(--destructive)] p-3 text-[13px] text-[var(--destructive)]">{error}</p>}
      <ZonaForm zona={zona} action={updateZona.bind(null, zona.id)} submitLabel="Guardar cambios" />
    </div>
  );
}
