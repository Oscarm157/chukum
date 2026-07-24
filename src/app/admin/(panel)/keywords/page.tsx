import Link from "next/link";
import { PageHeader } from "@/components/crm/PageShell";
import { getGruposBreve, getIdeas, getPlazas, getResumen } from "@/lib/keywords-data";
import type { KwMercado } from "@/lib/schema";
import { Explorador } from "./Explorador";
import { KeywordsProvider } from "./KeywordsContext";
import { Plegable } from "@/components/crm/Plegable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Keywords", robots: { index: false } };

const MERCADOS: Record<KwMercado, string> = {
  nacional_es: "Nacional",
  extranjero_en: "Extranjero",
};
const CHIPS = 14; // plazas en el filtro rápido; el resto, en el comparativo de abajo

const num = (n: number, d = 0) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtFecha = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric" }).format(d)
    : "—";

const url = (plaza?: string, mercado?: string) => {
  const p = new URLSearchParams();
  if (plaza) p.set("plaza", plaza);
  if (mercado) p.set("mercado", mercado);
  return `/admin/keywords${p.size ? `?${p}` : ""}`;
};

export default async function KeywordsPage({
  searchParams,
}: {
  searchParams: Promise<{ plaza?: string; mercado?: string }>;
}) {
  const sp = await searchParams;
  const mercado =
    sp.mercado === "nacional_es" || sp.mercado === "extranjero_en" ? sp.mercado : undefined;

  const [plazas, resumen, grupos] = await Promise.all([getPlazas(), getResumen(), getGruposBreve()]);
  const plaza = plazas.find((p) => p.plaza === sp.plaza)?.plaza;
  const ideas = await getIdeas({ plaza, mercado, limite: 600 });

  const escala = Math.max(...plazas.map((p) => p.total), 1);

  if (!resumen.keywords) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <PageHeader eyebrow="Pauta" title="Keywords" />
        <div className="crm-card p-10 text-center">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">Todavía no hay research cargado.</p>
          <p className="mt-1 text-[13px] text-[var(--crm-ink-faint)]">
            Corre el motor en /root/google-ads-automation y luego{" "}
            <span className="crm-num">node --env-file=.env.local scripts/import-keywords.mjs</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Pauta"
        title="Keywords"
        description={`Demanda medida en Google Keyword Planner. ${num(resumen.keywords)} keywords en ${num(resumen.plazas)} plazas, ${num(resumen.volumen)} búsquedas al mes. Última corrida: ${fmtFecha(resumen.corridaEn)}.`}
      />

      {/* Filtros: ciudad y mercado, sobre la tabla de keywords */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        <Link
          href={url(undefined, mercado)}
          className={`crm-btn crm-btn-sm ${!plaza ? "crm-btn-primary" : "crm-btn-secondary"}`}
        >
          Todas
        </Link>
        {plazas.slice(0, 6).map((p) => (
          <Link
            key={p.plaza}
            href={url(p.plaza === plaza ? undefined : p.plaza, mercado)}
            className={`crm-btn crm-btn-sm ${p.plaza === plaza ? "crm-btn-primary" : "crm-btn-secondary"}`}
          >
            {p.plaza}
          </Link>
        ))}
        {/* En móvil se ocultan (14 chips comen media pantalla); el wrapper lleva el
            `hidden` para no pelear con el display propio de .crm-btn. La activa siempre se ve. */}
        <span className="contents max-sm:hidden">
          {plazas.slice(6, CHIPS).map((p) => (
            <Link
              key={p.plaza}
              href={url(p.plaza === plaza ? undefined : p.plaza, mercado)}
              className={`crm-btn crm-btn-sm ${p.plaza === plaza ? "crm-btn-primary" : "crm-btn-secondary"}`}
            >
              {p.plaza}
            </Link>
          ))}
        </span>
        {plaza && plazas.slice(6, CHIPS).some((p) => p.plaza === plaza) && (
          <span className="crm-btn crm-btn-sm crm-btn-primary sm:hidden">{plaza}</span>
        )}
        {plaza && !plazas.slice(0, CHIPS).some((p) => p.plaza === plaza) && (
          <span className="crm-btn crm-btn-sm crm-btn-primary">{plaza}</span>
        )}
        <a href="#plazas" className="crm-btn crm-btn-sm crm-btn-ghost">
          Ver las {num(plazas.length)} plazas
        </a>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Link
          href={url(plaza)}
          className={`crm-btn crm-btn-sm ${!mercado ? "crm-btn-primary" : "crm-btn-secondary"}`}
        >
          Los dos mercados
        </Link>
        {(Object.keys(MERCADOS) as KwMercado[]).map((m) => (
          <Link
            key={m}
            href={url(plaza, m)}
            className={`crm-btn crm-btn-sm ${mercado === m ? "crm-btn-primary" : "crm-btn-secondary"}`}
          >
            {MERCADOS[m]}
          </Link>
        ))}
      </div>

      <KeywordsProvider ideas={ideas}>
        <Explorador total={resumen.keywords} grupos={grupos} />
      </KeywordsProvider>

      {/* Comparativo de plazas: para decidir dónde entrar, no para el día a día */}
      <div id="plazas" className="scroll-mt-20">
      <Plegable id="kw-plazas" titulo="Las plazas comparadas" contador={num(plazas.length)} inicial={false}>
      <div className="crm-card overflow-x-auto">
        <table className="crm-table">
          <thead className="crm-thead">
            <tr>
              <th className="crm-th">Plaza</th>
              <th className="crm-th">Reparto</th>
              <th className="crm-th text-right">Nacional</th>
              <th className="crm-th text-right">Extranjero</th>
              <th className="crm-th text-right">Total</th>
              <th className="crm-th text-right">CPC</th>
              <th className="crm-th text-right">Disputa</th>
            </tr>
          </thead>
          <tbody>
            {plazas.map((p) => {
              const activa = p.plaza === plaza;
              return (
                <tr key={p.plaza} className="crm-row border-t border-[var(--crm-line)]">
                  <td className="crm-td">
                    <Link
                      href={url(activa ? undefined : p.plaza, mercado)}
                      className={`font-medium transition-colors hover:text-[var(--crm-accent-strong)] ${
                        activa ? "text-[var(--crm-accent-strong)]" : "text-[var(--crm-ink)]"
                      }`}
                    >
                      {p.plaza}
                    </Link>
                    <span className="ml-2 text-[12px] text-[var(--crm-ink-faint)]">
                      {num(p.keywords)} kw
                    </span>
                  </td>
                  <td className="crm-td w-[150px]">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--crm-surface-3)]">
                      <span
                        className="bg-[var(--crm-accent)]"
                        style={{ width: `${(p.nacional / escala) * 100}%` }}
                      />
                      <span
                        className="bg-[var(--crm-ink-faint)]"
                        style={{ width: `${(p.extranjero / escala) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                    {num(p.nacional)}
                  </td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                    {num(p.extranjero)}
                  </td>
                  <td className="crm-td crm-num text-right text-[13.5px] font-semibold text-[var(--crm-ink)]">
                    {num(p.total)}
                  </td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                    ${p.cpc.toFixed(2)}
                  </td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-mute)]">
                    {num(p.disputa * 100)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </Plegable>
      </div>
    </div>
  );
}
