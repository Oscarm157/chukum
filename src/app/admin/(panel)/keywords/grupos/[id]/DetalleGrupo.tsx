"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, X } from "lucide-react";
import { Calculadora } from "../../Calculadora";
import { actualizarGrupo, borrarGrupo, quitarKeyword } from "../../actions";

/**
 * Las keywords del grupo, con la calculadora acotada a este grupo.
 * El estado (borrador / listo / lanzado) es lo que dice si ya se lanzó en Google Ads.
 */

const ESTADOS = [
  { valor: "borrador", label: "Borrador" },
  { valor: "listo", label: "Listo para lanzar" },
  { valor: "lanzado", label: "Lanzado" },
] as const;

const COMPETENCIA: Record<string, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };

const num = (n: number, d = 0) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

type Keyword = { keyword: string; volumen: number; cpc: number; competencia: string };

export function DetalleGrupo({
  grupo,
  keywords,
}: {
  grupo: { id: string; nombre: string; estado: string; notas: string };
  keywords: Keyword[];
}) {
  const router = useRouter();
  const [pendiente, arranca] = useTransition();
  const [notas, setNotas] = useState(grupo.notas);
  const [notasGuardadas, setNotasGuardadas] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);

  const volumen = keywords.reduce((a, k) => a + k.volumen, 0);
  const conPuja = keywords.filter((k) => k.cpc > 0);
  const cpc = conPuja.length
    ? conPuja.reduce((a, k) => a + k.cpc * k.volumen, 0) /
      Math.max(1, conPuja.reduce((a, k) => a + k.volumen, 0))
    : 0;

  function cambiarEstado(estado: string) {
    arranca(async () => {
      await actualizarGrupo({ id: grupo.id, estado: estado as (typeof ESTADOS)[number]["valor"] });
      router.refresh();
    });
  }

  function guardarNotas() {
    arranca(async () => {
      await actualizarGrupo({ id: grupo.id, notas });
      setNotasGuardadas(true);
      setTimeout(() => setNotasGuardadas(false), 1800);
      router.refresh();
    });
  }

  function quitar(keyword: string) {
    arranca(async () => {
      await quitarKeyword({ grupoId: grupo.id, keyword });
      router.refresh();
    });
  }

  function borrar() {
    arranca(async () => {
      await borrarGrupo(grupo.id);
      router.push("/admin/keywords/grupos");
    });
  }

  async function copiar() {
    await navigator.clipboard.writeText(keywords.map((k) => k.keyword).join("\n"));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {ESTADOS.map((e) => (
          <button
            key={e.valor}
            type="button"
            disabled={pendiente}
            onClick={() => cambiarEstado(e.valor)}
            className={`crm-btn crm-btn-sm ${
              grupo.estado === e.valor ? "crm-btn-primary" : "crm-btn-secondary"
            }`}
          >
            {e.label}
          </button>
        ))}
        <button type="button" onClick={copiar} className="crm-btn crm-btn-sm crm-btn-secondary ml-auto">
          {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copiado ? "Copiadas" : "Copiar keywords"}
        </button>
        {confirmaBorrar ? (
          <>
            <button
              type="button"
              disabled={pendiente}
              onClick={borrar}
              className="crm-btn crm-btn-sm crm-btn-ghost"
            >
              Confirmar borrado
            </button>
            <button
              type="button"
              onClick={() => setConfirmaBorrar(false)}
              className="crm-btn crm-btn-sm crm-btn-secondary"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmaBorrar(true)}
            className="crm-btn crm-btn-sm crm-btn-ghost"
          >
            Borrar grupo
          </button>
        )}
      </div>

      <div className="mb-5">
        <Calculadora cpcSugerido={cpc} volumen={volumen} origen="las keywords de este grupo" />
      </div>

      {keywords.length === 0 ? (
        <div className="crm-card p-10 text-center">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">
            El grupo se quedó sin keywords.
          </p>
        </div>
      ) : (
        <div className="crm-card mb-5 overflow-x-auto">
          <table className="crm-table">
            <thead className="crm-thead">
              <tr>
                <th className="crm-th">Keyword</th>
                <th className="crm-th text-right">Vol/mes</th>
                <th className="crm-th text-right">Competencia</th>
                <th className="crm-th text-right">CPC</th>
                <th className="crm-th"></th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((k) => (
                <tr key={k.keyword} className="crm-row border-t border-[var(--crm-line)]">
                  <td className="crm-td text-[13.5px] text-[var(--crm-ink)]">{k.keyword}</td>
                  <td className="crm-td crm-num text-right text-[13.5px] font-medium text-[var(--crm-ink)]">
                    {num(k.volumen)}
                  </td>
                  <td className="crm-td text-right">
                    <span className="crm-badge">{COMPETENCIA[k.competencia] ?? "Sin dato"}</span>
                  </td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                    {k.cpc > 0 ? `$${k.cpc.toFixed(2)}` : "—"}
                  </td>
                  <td className="crm-td w-8 text-right">
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() => quitar(k.keyword)}
                      aria-label={`Quitar ${k.keyword}`}
                      className="text-[var(--crm-ink-faint)] transition-colors hover:text-[var(--crm-ink)]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="crm-card p-4">
        <label className="mb-2 block text-[13px] text-[var(--crm-ink-soft)]">
          Notas del grupo
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Qué funciona aquí, qué negativas hacen falta, con qué anuncio va."
          className="crm-textarea w-full"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={pendiente || notas === grupo.notas}
            onClick={guardarNotas}
            className="crm-btn crm-btn-sm crm-btn-secondary"
          >
            Guardar notas
          </button>
          {notasGuardadas && (
            <span className="text-[12.5px] text-[var(--crm-ink-mute)]">Guardadas</span>
          )}
        </div>
      </div>
    </>
  );
}
