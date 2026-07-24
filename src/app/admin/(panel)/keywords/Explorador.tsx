"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Check } from "lucide-react";
import type { IdeaFila } from "@/lib/keywords-data";
import { AgregarAGrupo } from "./AgregarAGrupo";
import { Calculadora } from "./Calculadora";
import { claveIdea, useKeywords, type Columna, type Orden } from "./KeywordsContext";

/**
 * Explora las keywords del filtro activo: orden por cualquier columna, búsqueda,
 * filtros de volumen y competencia, y selección múltiple. Lo que seleccionas
 * alimenta la calculadora, así el estimado es del grupo de anuncios que estás armando.
 */

const MERCADOS: Record<string, string> = { nacional_es: "Nacional", extranjero_en: "Extranjero" };
const COMPETENCIA: Record<string, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };

const num = (n: number, d = 0) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

export function Explorador({
  total,
  grupos,
}: {
  total: number;
  grupos: Array<{ id: string; nombre: string; plaza: string; tema: string }>;
}) {
  const {
    visibles,
    seleccion,
    filtros,
    orden,
    elegidas,
    setFiltros,
    setOrden,
    alternar,
    alternarTodas,
    limpiarSeleccion,
  } = useKeywords();
  const [copiado, setCopiado] = useState(false);

  // Las cifras del panel salen de la selección; sin selección, de lo que está a la vista.
  const base = seleccion.length ? seleccion : visibles;
  const volumenBase = base.reduce((a, k) => a + k.volumen, 0);
  const conPuja = base.filter((k) => k.cpc > 0);
  // CPC ponderado por volumen: una keyword de 4,000 pesa más que una de 20.
  const cpcBase = conPuja.length
    ? conPuja.reduce((a, k) => a + k.cpc * k.volumen, 0) /
      Math.max(1, conPuja.reduce((a, k) => a + k.volumen, 0))
    : 0;

  const todasElegidas = visibles.length > 0 && visibles.every((k) => elegidas.has(claveIdea(k)));

  function ordenarPor(col: Columna) {
    setOrden(
      orden.col === col
        ? { col, desc: !orden.desc }
        : { col, desc: col !== "keyword" && col !== "plaza" },
    );
  }

  async function copiar() {
    await navigator.clipboard.writeText(seleccion.map((k) => k.keyword).join("\n"));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <>
      {/* Filtros */}
      <div className="crm-card mb-3 flex flex-wrap items-center gap-2.5 p-3">
        <input
          type="search"
          value={filtros.busqueda}
          onChange={(ev) => setFiltros({ busqueda: ev.target.value })}
          placeholder="Buscar en las keywords"
          className="crm-input w-full sm:w-[260px]"
        />
        <label className="flex items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
          Volumen mínimo
          <select
            value={filtros.minVolumen}
            onChange={(ev) => setFiltros({ minVolumen: Number(ev.target.value) })}
            className="crm-select w-[100px]"
          >
            {[0, 50, 100, 500, 1000].map((v) => (
              <option key={v} value={v}>
                {v === 0 ? "Cualquiera" : num(v)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1.5">
          {(["LOW", "MEDIUM", "HIGH"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() =>
                setFiltros({
                  competencias: filtros.competencias.includes(c)
                    ? filtros.competencias.filter((x) => x !== c)
                    : [...filtros.competencias, c],
                })
              }
              className={`crm-btn crm-btn-sm ${
                filtros.competencias.includes(c) ? "crm-btn-primary" : "crm-btn-secondary"
              }`}
            >
              {COMPETENCIA[c]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[var(--crm-ink-soft)]">
          <input
            type="checkbox"
            checked={filtros.soloConPuja}
            onChange={(ev) => setFiltros({ soloConPuja: ev.target.checked })}
            className="size-3.5 accent-[var(--crm-accent)]"
          />
          Solo con puja
        </label>
        <span className="ml-auto text-[12.5px] text-[var(--crm-ink-faint)]">
          {num(visibles.length)} de {num(total)} keywords
        </span>
      </div>

      {/* Barra de selección */}
      {seleccion.length > 0 && (
        <div className="crm-card mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 p-3">
          <span className="text-[13.5px] font-medium text-[var(--crm-ink)]">
            {num(seleccion.length)} seleccionadas
          </span>
          <span className="crm-num text-[13px] text-[var(--crm-ink-soft)]">
            {num(volumenBase)} búsquedas/mes
          </span>
          <span className="crm-num text-[13px] text-[var(--crm-ink-soft)]">
            CPC ponderado ${cpcBase.toFixed(2)}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <AgregarAGrupo
              seleccion={seleccion}
              grupos={grupos}
              onListo={limpiarSeleccion}
            />
            <button type="button" onClick={copiar} className="crm-btn crm-btn-sm crm-btn-secondary">
              {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiado ? "Copiadas" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="crm-btn crm-btn-sm crm-btn-ghost"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="crm-card mb-6 p-10 text-center">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">
            Ninguna keyword pasa estos filtros.
          </p>
        </div>
      ) : (
        <div className="crm-card mb-6 overflow-hidden">
          <table className="crm-table">
            <thead className="crm-thead">
              <tr>
                <th className="crm-th w-9 pr-0">
                  <input
                    type="checkbox"
                    checked={todasElegidas}
                    onChange={alternarTodas}
                    aria-label="Seleccionar todas las visibles"
                    className="size-3.5 accent-[var(--crm-accent)]"
                  />
                </th>
                <Th col="keyword" orden={orden} onClick={ordenarPor}>
                  Keyword
                </Th>
                <Th col="plaza" orden={orden} onClick={ordenarPor}>
                  Plaza
                </Th>
                <th className="crm-th">Mercado</th>
                <Th col="volumen" orden={orden} onClick={ordenarPor} derecha>
                  Vol/mes
                </Th>
                <Th col="competencia" orden={orden} onClick={ordenarPor} derecha>
                  Competencia
                </Th>
                <Th col="cpc" orden={orden} onClick={ordenarPor} derecha>
                  Puja USD
                </Th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((k) => {
                const elegida = elegidas.has(claveIdea(k));
                return (
                  <tr
                    key={claveIdea(k)}
                    onClick={() => alternar(k)}
                    className="crm-row cursor-pointer border-t border-[var(--crm-line)]"
                    style={elegida ? { background: "var(--crm-surface-3)" } : undefined}
                  >
                    <td className="crm-td pr-0">
                      <input
                        type="checkbox"
                        checked={elegida}
                        onChange={() => alternar(k)}
                        onClick={(ev) => ev.stopPropagation()}
                        aria-label={k.keyword}
                        className="size-3.5 accent-[var(--crm-accent)]"
                      />
                    </td>
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
                        {COMPETENCIA[k.competencia] ?? "Sin dato"}
                        {COMPETENCIA[k.competencia] && ` · ${k.indice}`}
                      </span>
                    </td>
                    <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">
                      {k.cpc > 0 ? `$${k.cpcBaja.toFixed(2)} – $${k.cpc.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Calculadora
        cpcSugerido={cpcBase}
        volumen={volumenBase}
        origen={
          seleccion.length
            ? `${num(seleccion.length)} keywords seleccionadas`
            : `${num(visibles.length)} keywords a la vista`
        }
      />
    </>
  );
}

function Th({
  col,
  orden,
  onClick,
  derecha,
  children,
}: {
  col: Columna;
  orden: Orden;
  onClick: (c: Columna) => void;
  derecha?: boolean;
  children: React.ReactNode;
}) {
  const activa = orden.col === col;
  const Icono = orden.desc ? ArrowDown : ArrowUp;
  return (
    <th className={`crm-th crm-th-sort ${derecha ? "text-right" : ""}`} onClick={() => onClick(col)}>
      <span className={`inline-flex items-center gap-1 ${activa ? "text-[var(--crm-ink)]" : ""}`}>
        {children}
        {activa && <Icono className="size-3" />}
      </span>
    </th>
  );
}
