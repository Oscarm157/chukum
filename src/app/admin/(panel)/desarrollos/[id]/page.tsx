import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDesarrolloById,
  getUnitsForDesarrollo,
  getImagesForDesarrollo,
  getZonaOptions,
} from "@/lib/desarrollos-data";
import { updateDesarrollo } from "../actions";
import { DesarrolloForm } from "@/components/crm/desarrollos/DesarrolloForm";
import { DeleteDesarrolloButton } from "@/components/crm/desarrollos/DeleteDesarrolloButton";
import { ModelosEditor } from "@/components/crm/desarrollos/ModelosEditor";
import { Gallery } from "@/components/crm/desarrollos/Gallery";
import { SectionHeader } from "@/components/crm/PageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar desarrollo", robots: { index: false } };

export default async function DesarrolloDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const dev = await getDesarrolloById(id);
  if (!dev) notFound();

  const [modelos, imagenes, zonaOptions] = await Promise.all([
    getUnitsForDesarrollo(id),
    getImagesForDesarrollo(id),
    getZonaOptions(),
  ]);

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/desarrollos" className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--crm-ink-mute)] transition-colors hover:text-[var(--crm-ink)]">
          <span aria-hidden>&larr;</span> Desarrollos
        </Link>
        <DeleteDesarrolloButton id={dev.id} />
      </div>

      <div className="crm-fade mb-6">
        <h1 className="crm-h1">{dev.name}</h1>
        <p className="mt-2 crm-num text-[13px] text-[var(--crm-ink-mute)]">/{dev.slug}</p>
      </div>

      <section className="mb-10">
        <SectionHeader title="Fotos" className="mb-4" />
        <Gallery devId={dev.id} images={imagenes} />
      </section>

      <section className="mb-10">
        <SectionHeader title="Modelos" className="mb-4" />
        <ModelosEditor devId={dev.id} units={modelos} />
      </section>

      <section>
        <SectionHeader title="Información del desarrollo" className="mb-4" />
        {error && (
          <p className="crm-card mb-4 border-[var(--destructive)] p-3 text-[13px] text-[var(--destructive)]">{error}</p>
        )}
        <DesarrolloForm dev={dev} zonaOptions={zonaOptions} action={updateDesarrollo.bind(null, dev.id)} submitLabel="Guardar cambios" />
      </section>
    </div>
  );
}
