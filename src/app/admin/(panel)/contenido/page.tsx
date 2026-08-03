import Link from "next/link";
import type { SocialPostStatus } from "@/lib/schema";
import { getSocialPosts, getSocialPostCounts, getSocialAccounts } from "@/lib/contenido-data";
import { PageHeader } from "@/components/crm/PageShell";
import { SincronizarCuentasButton } from "@/components/crm/contenido/SincronizarCuentasButton";
import { EstadoBadge, PlataformaBadges, STATUS_LABEL, PLATFORM_LABEL, fmtFecha } from "@/components/crm/contenido/badges";

export const dynamic = "force-dynamic";
export const metadata = { title: "Redes sociales", robots: { index: false } };

const FILTROS: SocialPostStatus[] = ["borrador", "programado", "publicado", "error"];

export default async function ContenidoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = FILTROS.includes(sp.status as SocialPostStatus) ? (sp.status as SocialPostStatus) : undefined;

  const [items, counts, cuentas] = await Promise.all([
    getSocialPosts(status),
    getSocialPostCounts(),
    getSocialAccounts(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Contenido"
        title="Redes sociales"
        description="Borradores de post para Facebook e Instagram. Nada sale a las redes hasta que lo apruebas aquí."
        actions={<Link href="/admin/contenido/nuevo" className="crm-btn crm-btn-primary">Nuevo post</Link>}
      >
        <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-2">
          <p className="text-[12.5px] text-[var(--crm-ink-mute)]">
            {cuentas.length === 0
              ? "Sin cuentas conectadas todavía."
              : `Cuentas conectadas: ${cuentas
                  .map((c) => `${PLATFORM_LABEL[c.platform] ?? c.platform}${c.username ? ` (${c.username})` : ""}`)
                  .join(", ")}`}
          </p>
          <SincronizarCuentasButton />
        </div>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin/contenido" className={`crm-btn crm-btn-sm ${!status ? "crm-btn-primary" : "crm-btn-secondary"}`}>
          Todos <span className="crm-num ml-1 opacity-70">{total}</span>
        </Link>
        {FILTROS.map((s) => (
          <Link
            key={s}
            href={`/admin/contenido?status=${s}`}
            className={`crm-btn crm-btn-sm ${status === s ? "crm-btn-primary" : "crm-btn-secondary"}`}
          >
            {STATUS_LABEL[s]} <span className="crm-num ml-1 opacity-70">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="crm-empty px-6 py-20">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">
            {status ? "No hay posts con este filtro." : "Aún no hay posts."}
          </p>
          {!status && (
            <>
              <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--crm-ink-mute)]">
                Genera un borrador desde un desarrollo del catálogo o desde un tema que escribas tú.
              </p>
              <Link href="/admin/contenido/nuevo" className="crm-btn crm-btn-secondary crm-btn-sm mt-4">
                Generar el primero
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          {/* Con miniatura + caption la tabla es ancha: en móvil se desplaza, no se corta. */}
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead className="crm-thead">
                <tr>
                  <th className="crm-th">Post</th>
                  <th className="crm-th">Fuente</th>
                  <th className="crm-th">Plataformas</th>
                  <th className="crm-th">Estado</th>
                  <th className="crm-th text-right">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={p.id}
                    className="crm-row crm-fade border-t border-[var(--crm-line)]"
                    style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
                  >
                    <td className="crm-td">
                      <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="size-12 shrink-0 rounded-lg border border-[var(--crm-line)] object-cover"
                        />
                        <Link
                          href={`/admin/contenido/${p.id}`}
                          className="line-clamp-2 max-w-[46ch] text-[13.5px] leading-snug text-[var(--crm-ink)] transition-colors hover:text-[var(--crm-accent-strong)]"
                        >
                          {p.caption}
                        </Link>
                      </div>
                    </td>
                    <td className="crm-td text-[13px] text-[var(--crm-ink-soft)]">
                      {p.sourceType === "desarrollo" ? (p.developmentName ?? "Desarrollo") : "Tema libre"}
                    </td>
                    <td className="crm-td">
                      <PlataformaBadges platforms={p.platforms} />
                    </td>
                    <td className="crm-td">
                      <EstadoBadge status={p.status} />
                    </td>
                    <td className="crm-td crm-num text-right text-[13px] whitespace-nowrap text-[var(--crm-ink-mute)]">
                      {p.status === "programado" && p.scheduledAt ? (
                        <span title="Programado para">{fmtFecha(p.scheduledAt)}</span>
                      ) : (
                        fmtFecha(p.createdAt)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
