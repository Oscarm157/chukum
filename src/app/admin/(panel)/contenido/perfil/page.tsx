import { getPerfilActivo } from "@/lib/contenido-data";
import { PageHeader } from "@/components/crm/PageShell";
import { ContenidoBreadcrumb } from "@/components/crm/contenido/navegacion";
import { PerfilVendedorForm } from "@/components/crm/contenido/PerfilVendedorForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil de vendedor", robots: { index: false } };

export default async function PerfilVendedorPage() {
  const perfil = await getPerfilActivo();

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="mb-5">
        <ContenidoBreadcrumb actual="Perfil de vendedor" />
      </div>
      <PageHeader
        eyebrow="Contenido"
        title="Perfil de vendedor"
        description="Nombre, teléfono y foto que se insertan al activar la firma en el editor de texto de un post. Hay un solo perfil: el que esté guardado aquí es el que se usa."
      />
      <PerfilVendedorForm
        perfil={perfil ? { name: perfil.name, phone: perfil.phone, photoUrl: perfil.photoUrl } : null}
      />
    </div>
  );
}
