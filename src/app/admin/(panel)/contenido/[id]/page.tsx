import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  getSocialPostById,
  getSocialAccounts,
  getSocialPostImages,
  getFotosDelDesarrollo,
  getSocialPostVecinos,
} from "@/lib/contenido-data";
import { SectionHeader } from "@/components/crm/PageShell";
import { PostEditor } from "@/components/crm/contenido/PostEditor";
import { DescartarPostButton } from "@/components/crm/contenido/DescartarPostButton";
import { ContenidoBreadcrumb, PostVecinos } from "@/components/crm/contenido/navegacion";
import { EstadoBadge, PlataformaBadges, EDITABLE, fmtFecha } from "@/components/crm/contenido/badges";

export const dynamic = "force-dynamic";
// Techo de las server actions de esta página. La edición con IA tarda entre 30s y ~100s
// (medido contra Replicate); con el default se cortaría a media generación.
export const maxDuration = 180;
export const metadata = { title: "Post", robots: { index: false } };

// El caption es un post entero: en la ruta va solo el arranque, en una línea.
function resumenCaption(caption: string): string {
  const limpio = caption.replace(/\s+/g, " ").trim();
  if (!limpio) return "Post sin texto";
  return limpio.length > 40 ? `${limpio.slice(0, 40).trimEnd()}…` : limpio;
}

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getSocialPostById(id);
  if (!post) notFound();

  const cuentas = await getSocialAccounts();
  const imagenesCarrusel = await getSocialPostImages(post.id);
  const fotosCatalogo = post.developmentId ? await getFotosDelDesarrollo(post.developmentId) : [];
  const vecinos = await getSocialPostVecinos(post.id);
  const editable = EDITABLE.includes(post.status);
  const yaSalio = post.status === "programado" || post.status === "publicado";

  return (
    <div className="mx-auto max-w-[960px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ContenidoBreadcrumb actual={resumenCaption(post.caption)} />
        <div className="flex items-center gap-2">
          <PostVecinos anterior={vecinos.anterior} siguiente={vecinos.siguiente} />
          <DescartarPostButton id={post.id} yaSalio={yaSalio} />
        </div>
      </div>

      <div className="crm-fade mb-6 flex flex-wrap items-center gap-3">
        <h1 className="crm-h1">
          {post.sourceType === "desarrollo" ? (post.developmentName ?? "Desarrollo") : "Tema libre"}
        </h1>
        <EstadoBadge status={post.status} />
      </div>

      {post.status === "error" && post.errorMessage && (
        <div
          className="crm-card mb-5 flex items-start gap-2.5 p-4"
          style={{ borderColor: "var(--destructive)" }}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--destructive)]" strokeWidth={2} />
          <div>
            <p className="text-[13.5px] font-medium text-[var(--crm-ink)]">No se pudo enviar a Post for Me</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--crm-ink-soft)]">{post.errorMessage}</p>
            <p className="mt-1.5 text-[12px] text-[var(--crm-ink-mute)]">
              El borrador sigue completo. Corrige lo que haga falta y vuelve a aprobarlo.
            </p>
          </div>
        </div>
      )}

      <section className="crm-card crm-fade mb-5 p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          {/* Editable: la imagen vive en el editor (con el recorte), no se repite aquí. */}
          {!editable && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.imageUrl}
              alt=""
              className="w-full shrink-0 rounded-lg border border-[var(--crm-line)] object-cover sm:h-[220px] sm:w-[220px]"
            />
          )}
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 self-start text-[13px]">
            <div>
              <dt className="text-[12px] text-[var(--crm-ink-mute)]">Creado</dt>
              <dd className="crm-num mt-0.5 text-[var(--crm-ink-soft)]">{fmtFecha(post.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--crm-ink-mute)]">
                {post.status === "publicado" ? "Publicado" : "Programado para"}
              </dt>
              <dd className="crm-num mt-0.5 text-[var(--crm-ink-soft)]">
                {post.status === "publicado"
                  ? fmtFecha(post.scheduledAt ?? post.updatedAt)
                  : fmtFecha(post.scheduledAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--crm-ink-mute)]">Plataformas</dt>
              <dd className="mt-1">
                <PlataformaBadges platforms={post.platforms} />
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-[var(--crm-ink-mute)]">Id en Post for Me</dt>
              <dd className="crm-num mt-0.5 break-all text-[12.5px] text-[var(--crm-ink-mute)]">
                {post.postForMeId ?? "—"}
              </dd>
            </div>
            {post.sourceType === "libre" && post.topic && (
              <div className="col-span-2">
                <dt className="text-[12px] text-[var(--crm-ink-mute)]">Brief</dt>
                <dd className="mt-0.5 leading-relaxed text-[var(--crm-ink-soft)]">{post.topic}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {editable ? (
        <PostEditor
          post={{
            id: post.id,
            caption: post.caption,
            imageUrl: post.imageUrl,
            platforms: post.platforms,
            scheduledAt: post.scheduledAt,
            format: post.format,
            placement: post.placement,
          }}
          cuentas={cuentas}
          imagenesCarrusel={imagenesCarrusel}
          fotosCatalogo={fotosCatalogo}
        />
      ) : (
        <section className="crm-card crm-fade p-6">
          <SectionHeader title="Texto del post" className="mb-3" />
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--crm-ink)]">{post.caption}</p>
          <p className="mt-4 border-t border-[var(--crm-line)] pt-3 text-[12.5px] text-[var(--crm-ink-mute)]">
            Este post ya se envió a Post for Me, así que aquí queda solo de consulta. Para cambiarlo o bajarlo, entra al
            panel de Post for Me o a la red directamente.
          </p>
        </section>
      )}
    </div>
  );
}
