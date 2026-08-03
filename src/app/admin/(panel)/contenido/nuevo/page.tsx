import Link from "next/link";
import { getDesarrolloOptionsParaContenido } from "@/lib/contenido-data";
import { PageHeader } from "@/components/crm/PageShell";
import { NuevoPostForm } from "@/components/crm/contenido/NuevoPostForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nuevo post", robots: { index: false } };

export default async function NuevoPostPage() {
  const desarrollos = await getDesarrolloOptionsParaContenido();

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="mb-5">
        <Link
          href="/admin/contenido"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--crm-ink-mute)] transition-colors hover:text-[var(--crm-ink)]"
        >
          <span aria-hidden>&larr;</span> Redes sociales
        </Link>
      </div>
      <PageHeader
        eyebrow="Contenido"
        title="Nuevo post"
        description="Elige la fuente y se genera un borrador con caption e imagen. Lo revisas y editas antes de aprobarlo."
      />
      <NuevoPostForm desarrollos={desarrollos} />
    </div>
  );
}
