import { getDesarrolloOptionsParaContenido } from "@/lib/contenido-data";
import { PageHeader } from "@/components/crm/PageShell";
import { NuevoPostForm } from "@/components/crm/contenido/NuevoPostForm";
import { ContenidoBreadcrumb } from "@/components/crm/contenido/navegacion";

export const dynamic = "force-dynamic";
// Techo de las server actions de esta página. La edición con IA tarda entre 30s y ~100s
// (medido contra Replicate); con el default se cortaría a media generación.
export const maxDuration = 180;
export const metadata = { title: "Nuevo post", robots: { index: false } };

export default async function NuevoPostPage() {
  const desarrollos = await getDesarrolloOptionsParaContenido();

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="mb-5">
        <ContenidoBreadcrumb actual="Nuevo" />
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
