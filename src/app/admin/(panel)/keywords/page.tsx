import Link from "next/link";
import { PageHeader } from "@/components/crm/PageShell";
import { getIdeas, getPlazas, getResumen } from "@/lib/keywords-data";
import type { KwMercado } from "@/lib/schema";
import { Calculadora } from "./Calculadora";

export const dynamic = "force-dynamic";
export const metadata = { title: "Keywords", robots: { index: false } };

const MERCADOS: Record<KwMercado, string> = {
  nacional_es: "Nacional",
  extranjero_en: "Extranjero",
};
const COMPETENCIA: Record<string, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };

const num = (n: number, d = 0) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtFecha = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric" }).format(d)
    : "—";

export default async function KeywordsPage({
  searchParams,
}: {
  searchParams: Promise<{ plaza?: string; mercado?: string }>;
}) {
  const sp = await searchParams;
  const mercado = sp.mercado === "nacional_es" || sp.mercado === "extranjero_en" ? sp.mercado : undefined;

  const [plazas, resumen] = await Promise.all([getPlazas(), getResumen()]);
  const plaza = plazas.find((p) => p.plaza === sp.plaza)?.plaza;
  const ideas = await getIdeas({ plaza, mercado, limite: 120 });

  const seleccionada = plazas.find((p) => p.plaza === plaza);
  // Sin plaza elegida, el CPC de referencia es el promedio de todas, no el de la primera fila.
  const conCpc = plazas.filter((p) => p.cpc > 0);
  const cpcSugerido =
    seleccionada?.cpc ?? (conCpc.length ? conCpc.reduce((a, p) => a + p.cpc, 0) / conCpc.length : 1);
  const escala = Math.max(...plazas.map((p) => p.total), 1);

  if (!resumen.keywords) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <PageHeader eyebrow="Pauta" title="Keywords" />
        <div className="crm-card p-10 text-center">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">
            Todavía no hay research cargado.
          </p>
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

      <div className="mb-5">
        <Calculadora cpcSugerido={cpcSugerido} plaza={seleccionada?.plaza ?? "referencia"} />
      </div>

      {/* Comparativo de plazas: la vista que responde dónde conviene entrar */}
      <div className="crm-card mb-5 overflow-hidden">
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
                <tr
                  key={p.plaza}
                  className="crm-row border-t border-[var(--crm-line)]"
                  data-active={activa}
                >
                  <td className="crm-td">
                    <Link
                      href={activa ? "/admin/keywords" : `/admin/keywords?plaza=${encodeURIComponent(p.plaza)}`}
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

      {/* Keywords del filtro activo */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link
          href={plaza ? `/admin/keywords?plaza=${encodeURIComponent(plaza)}` : "/admin/keywords"}
          className={`crm-btn crm-btn-sm ${!mercado ? "crm-btn-primary" : "crm-btn-secondary"}`}
        >
          Los dos mercados
        </Link>
        {(Object.keys(MERCADOS) as KwMercado[]).map((m) => (
          <Link
            key={m}
            href={`/admin/keywords?${new URLSearchParams({ ...(plaza ? { plaza } : {}), mercado: m })}`}
            className={`crm-btn crm-btn-sm ${mercado === m ? "crm-btn-primary" : "crm-btn-secondary"}`}
          >
            {MERCADOS[m]}
          </Link>
        ))}
        {plaza && (
          <Link href="/admin/keywords" className="crm-btn crm-btn-sm crm-btn-ghost">
            Quitar filtro: {plaza}
          </Link>
        )}
        <span className="ml-auto text-[12.5px] text-[var(--crm-ink-faint)]">
          {ideas.length === 120 ? "las 120 más grandes" : `${ideas.length} keywords`}
        </span>
      </div>

      {ideas.length === 0 ? (
        <div className="crm-card p-10 text-center">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">
            No hay keywords con este filtro.
          </p>
        </div>
      ) : (
        <div className="crm-card overflow-hidden">
          <table className="crm-table">
            <thead className="crm-thead">
              <tr>
                <th className="crm-th">Keyword</th>
                <th className="crm-th">Plaza</th>
                <th className="crm-th">Mercado</th>
                <th className="crm-th text-right">Vol/mes</th>
                <th className="crm-th text-right">Competencia</th>
                <th className="crm-th text-right">Puja USD</th>
              </tr>
            </thead>
            <tbody>
              {ideas.map((k) => (
                <tr key={`${k.keyword}-${k.mercado}`} className="crm-row border-t border-[var(--crm-line)]">
                  <td className="crm-td">
                    <span className="text-[13.5px] text-[var(--crm-ink)]">{k.keyword}</span>
                    {k.variantes > 1 && (
                      <span className="ml-2 text-[12px] text-[var(--crm-ink-faint)]">
                        +{k.variantes - 1} variantes
                      </span>
                    )}
                  </td>
                  <td className="crm-td text-[13px] text-[var(--crm-ink-soft)]">{k.plaza}</td>
                  <td className="crm-td text-[13px] text-[var(--crm-ink-mute)]">
                    {MERCADOS[k.mercado]}
                  </td>
                  <td className="crm-td crm-num text-right text-[13.5px] font-medium text-[var(--crm-ink)]">
                    {num(k.volumen)}
                  </td>
                  <td className="crm-td text-right">
                    <span className="crm-badge">
                      {COMPETENCIA[k.competencia] ?? k.competencia} · {k.indice}
                    </span>
                  </td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                    ${k.cpcBaja.toFixed(2)} – ${k.cpc.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
