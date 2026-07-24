import Link from "next/link";
import { PageHeader } from "@/components/crm/PageShell";
import { getGrupos } from "@/lib/keywords-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Grupos de keywords", robots: { index: false } };

const TEMAS: Record<string, string> = {
  terrenos: "Terrenos",
  casas: "Casas",
  departamentos: "Departamentos",
  otro: "Otro",
};
const ESTADOS: Record<string, { label: string; clase: string }> = {
  borrador: { label: "Borrador", clase: "" },
  listo: { label: "Listo", clase: "crm-badge-amber" },
  lanzado: { label: "Lanzado", clase: "crm-badge-emerald" },
};

const num = (n: number, d = 0) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtFecha = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(d) : "—";

const COLUMNAS = ["volumen", "cpc", "disputa", "techoClics", "costoMes"] as const;
type Columna = (typeof COLUMNAS)[number];

export default async function GruposPage({
  searchParams,
}: {
  searchParams: Promise<{ orden?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const orden = (COLUMNAS as readonly string[]).includes(sp.orden ?? "")
    ? (sp.orden as Columna)
    : "volumen";
  const asc = sp.dir === "asc";

  const grupos = (await getGrupos()).sort((a, b) =>
    asc ? a[orden] - b[orden] : b[orden] - a[orden],
  );

  if (!grupos.length) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <PageHeader eyebrow="Pauta" title="Grupos" />
        <div className="crm-card p-10 text-center">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">Todavía no hay grupos.</p>
          <p className="mt-1 text-[13px] text-[var(--crm-ink-faint)]">
            Selecciona keywords en la tabla y usa &ldquo;Agregar a grupo&rdquo;.
          </p>
          <Link href="/admin/keywords" className="crm-btn crm-btn-sm crm-btn-primary mt-4">
            Ir a keywords
          </Link>
        </div>
      </div>
    );
  }

  const volumenTotal = grupos.reduce((a, g) => a + g.volumen, 0);
  const escala = Math.max(...grupos.map((g) => g.volumen), 1);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="Pauta"
        title="Grupos"
        description={`${num(grupos.length)} ${grupos.length === 1 ? "grupo armado" : "grupos armados"}, ${num(volumenTotal)} búsquedas al mes en total. Ordena por cualquier columna: por costo estimado sale cuál es más barato de atacar.`}
        actions={
          <Link href="/admin/keywords" className="crm-btn crm-btn-sm crm-btn-secondary">
            Agregar keywords
          </Link>
        }
      />

      <div className="crm-card overflow-x-auto">
        <table className="crm-table">
          <thead className="crm-thead">
            <tr>
              <th className="crm-th">Grupo</th>
              <th className="crm-th">Demanda</th>
              <Th col="volumen" orden={orden} asc={asc}>Vol/mes</Th>
              <Th col="cpc" orden={orden} asc={asc}>CPC</Th>
              <Th col="disputa" orden={orden} asc={asc}>Disputa</Th>
              <Th col="techoClics" orden={orden} asc={asc}>Clics techo</Th>
              <Th col="costoMes" orden={orden} asc={asc}>Costo/mes</Th>
              <th className="crm-th text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <tr key={g.id} className="crm-row border-t border-[var(--crm-line)]">
                <td className="crm-td">
                  <Link
                    href={`/admin/keywords/grupos/${g.id}`}
                    className="text-[14px] font-medium text-[var(--crm-ink)] transition-colors hover:text-[var(--crm-accent-strong)]"
                  >
                    {g.nombre}
                  </Link>
                  <div className="mt-0.5 text-[12px] text-[var(--crm-ink-faint)]">
                    {g.plaza} · {TEMAS[g.tema] ?? g.tema} ·{" "}
                    {g.mercado === "nacional_es" ? "Nacional" : "Extranjero"} · {num(g.keywords)} kw
                    {g.actualizado ? ` · ${fmtFecha(g.actualizado)}` : ""}
                  </div>
                </td>
                <td className="crm-td w-[130px]">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--crm-surface-3)]">
                    <span
                      className="block h-full bg-[var(--crm-accent)]"
                      style={{ width: `${(g.volumen / escala) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="crm-td crm-num text-right text-[13.5px] font-semibold text-[var(--crm-ink)]">
                  {num(g.volumen)}
                </td>
                <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                  ${g.cpc.toFixed(2)}
                </td>
                <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-mute)]">
                  {num(g.disputa * 100)}%
                </td>
                <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                  {num(g.techoClics)}
                </td>
                <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                  ${num(g.costoMes)}
                </td>
                <td className="crm-td text-right">
                  <span className={`crm-badge ${ESTADOS[g.estado]?.clase ?? ""}`}>
                    {ESTADOS[g.estado]?.label ?? g.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 max-w-prose text-[12.5px] leading-relaxed text-[var(--crm-ink-faint)]">
        Clics techo es lo máximo que da la demanda del grupo con supuestos de arranque (aparecer en
        el 65% de las búsquedas y 8% de clic por impresión). No es lo que alcanza a pagar un
        presupuesto: en la calculadora puedes ajustar esos dos supuestos. Costo/mes es ese techo
        por el CPC.
      </p>
    </div>
  );
}

/** Encabezado ordenable. Sin JS: el orden viaja en la URL, como los filtros de keywords. */
function Th({
  col,
  orden,
  asc,
  children,
}: {
  col: Columna;
  orden: Columna;
  asc: boolean;
  children: React.ReactNode;
}) {
  const activa = orden === col;
  // Click en la activa invierte; en otra, arranca de mayor a menor.
  const dir = activa && !asc ? "asc" : "desc";
  return (
    <th className="crm-th crm-th-sort text-right">
      <Link
        href={`/admin/keywords/grupos?orden=${col}&dir=${dir}`}
        className={activa ? "text-[var(--crm-ink)]" : ""}
      >
        {children}
        {activa && <span className="ml-1">{asc ? "\u2191" : "\u2193"}</span>}
      </Link>
    </th>
  );
}
