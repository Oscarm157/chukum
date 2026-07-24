"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Check } from "lucide-react";
import type { IdeaFila } from "@/lib/keywords-data";
import { AgregarAGrupo } from "./AgregarAGrupo";
import { Calculadora } from "./Calculadora";
import { claveIdea, useKeywords, type Columna, type Orden } from "./KeywordsContext";
import { Plegable } from "@/components/crm/Plegable";

/**
 * Explora las keywords del filtro activo: orden por cualquier columna, búsqueda,
 * filtros de volumen y competencia, y selección múltiple. Lo que seleccionas
 * alimenta la calculadora, así el estimado es del grupo de anuncios que estás armando.
 */

const MERCADOS: Record<string, string> = { nacional_es: "Nacional", extranjero_en: "Extranjero" };
const COMPETENCIA: Record<string, string> = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };

const PAGINA = 60; // filas visibles antes de "mostrar más": 600 de golpe era scroll sin fin

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
    destello,
    gen,
    setFiltros,
    setOrden,
    alternar,
    alternarTodas,
    limpiarSeleccion,
    limpiarDestello,
  } = useKeywords();
  const [copiado, setCopiado] = useState(false);
  const [mostrar, setMostrar] = useState(PAGINA);

  // El destello del asistente dura poco: se limpia solo tras la animación.
  useEffect(() => {
    if (!destello.size) return;
    const t = setTimeout(limpiarDestello, 1200);
    return () => clearTimeout(t);
  }, [destello, limpiarDestello]);

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
  // Al cambiar filtros/orden vuelve al principio de la lista.
  useEffect(() => {
    setMostrar(PAGINA);
  }, [filtros, orden, visibles.length]);
  const enPantalla = visibles.slice(0, mostrar);

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

      <Plegable id="kw-tabla" titulo="Keywords" contador={`${num(visibles.length)} de ${num(total)}`}>
      {visibles.length === 0 ? (
        <div className="crm-card p-10 text-center">
          <p className="text-[14px] text-[var(--crm-ink-soft)]">
            Ninguna keyword pasa estos filtros.
          </p>
        </div>
      ) : (
        <div className="crm-card overflow-x-auto">
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
            <tbody key={gen}>
              {enPantalla.map((k, i) => {
                const clave = claveIdea(k);
                const elegida = elegidas.has(clave);
                const destella = destello.has(clave);
                return (
                  <tr
                    key={clave}
                    onClick={() => alternar(k)}
                    // crm-fade: cascada al re-montar por cambio de orden/plaza (gen).
                    // crm-flash: destello verde de lo que el asistente acaba de marcar.
                    className={`crm-row crm-fade cursor-pointer border-t border-[var(--crm-line)] ${
                      destella ? "crm-flash" : ""
                    }`}
                    style={{
                      animationDelay: `${Math.min(i, 16) * 22}ms`,
                      ...(elegida && !destella ? { background: "var(--crm-surface-3)" } : {}),
                    }}
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
          {mostrar < visibles.length && (
            <button
              type="button"
              onClick={() => setMostrar((m) => m + PAGINA)}
              className="w-full border-t border-[var(--crm-line)] py-2.5 text-[13px] font-medium text-[var(--crm-accent-strong)] transition-colors hover:bg-[var(--crm-surface-2)]"
            >
              Mostrar {num(Math.min(PAGINA, visibles.length - mostrar))} más ({num(visibles.length - mostrar)} restantes)
            </button>
          )}
        </div>
      )}
      </Plegable>

      <Plegable id="kw-calc" titulo="Calculadora de presupuesto">
        <Calculadora
          cpcSugerido={cpcBase}
          volumen={volumenBase}
          origen={
            seleccion.length
              ? `${num(seleccion.length)} keywords seleccionadas`
              : `${num(visibles.length)} keywords a la vista`
          }
        />
      </Plegable>
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
