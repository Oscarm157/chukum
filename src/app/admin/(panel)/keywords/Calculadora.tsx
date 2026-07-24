"use client";

import { useEffect, useState } from "react";

/**
 * Traduce presupuesto a leads con el CPC de lo que se esté mirando: la selección
 * de keywords si hay una, y si no, todo lo que está a la vista.
 * El escenario se guarda: al volver a la pantalla sigue ahí.
 */
const CLAVE = "kw-escenario";

export function Calculadora({
  cpcSugerido,
  volumen,
  origen,
}: {
  cpcSugerido: number;
  volumen: number;
  /** Qué se está midiendo, para que las cifras digan de dónde salen. */
  origen: string;
}) {
  const [e, setE] = useState({
    presupuesto: 500,
    cpc: cpcSugerido || 1,
    ctr: 8, // de cada 100 veces que sale el anuncio, cuántas reciben clic
    cobertura: 65, // de todas las búsquedas, en cuántas alcanzas a aparecer
    conversion: 2, // de cada 100 clics, cuántos dejan sus datos
    tipoCambio: 18.5,
  });
  const [listo, setListo] = useState(false);
  const { presupuesto, cpc, ctr, cobertura, conversion, tipoCambio } = e;

  // El escenario se restaura tras montar: localStorage no existe en el servidor.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado) setE((prev) => ({ ...prev, ...JSON.parse(guardado) }));
    } catch {
      // escenario corrupto: se ignora y quedan los valores por defecto
    }
    setListo(true);
  }, []);

  useEffect(() => {
    if (listo) localStorage.setItem(CLAVE, JSON.stringify(e));
  }, [listo, e]);

  const setCampo = (campo: keyof typeof e) => (v: number) =>
    setE((prev) => ({ ...prev, [campo]: v }));

  // El techo de clics sale de dos cosas, no de una: de cuántas búsquedas alcanzas a
  // aparecer (cobertura) y de cuántas de esas te dan clic (CTR). El presupuesto compra
  // clics hasta ese techo; más presupuesto no compra demanda que no existe.
  const techo = volumen * (cobertura / 100) * (ctr / 100);
  const clicsQuePaga = cpc > 0 ? presupuesto / cpc : 0;
  const clics = Math.min(clicsQuePaga, techo);
  const topado = clicsQuePaga > techo;
  const gastoReal = clics * cpc;
  const leads = clics * (conversion / 100);
  const costoLead = leads > 0 ? gastoReal / leads : 0;
  const costoLeadMxn = costoLead * tipoCambio;

  const num = (n: number, d = 0) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

  return (
    <div className="crm-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="crm-h2">Cuántos leads salen con este presupuesto</h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--crm-ink-mute)]">Sobre {origen}</p>
        </div>
        <button
          type="button"
          onClick={() => setCampo("cpc")(cpcSugerido)}
          className="crm-btn crm-btn-sm crm-btn-secondary"
        >
          Usar CPC medido: ${cpcSugerido.toFixed(2)}
        </button>
      </div>

      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
        <Campo
          label="Presupuesto al mes (USD)"
          valor={presupuesto}
          min={50}
          max={5000}
          paso={50}
          onChange={setCampo("presupuesto")}
          formato={(v) => `$${num(v)}`}
        />
        <Campo
          label="CPC esperado (USD)"
          valor={cpc}
          min={0.1}
          max={5}
          paso={0.05}
          onChange={setCampo("cpc")}
          formato={(v) => `$${v.toFixed(2)}`}
        />
        <Campo
          label="Tipo de cambio"
          valor={tipoCambio}
          min={15}
          max={25}
          paso={0.5}
          onChange={setCampo("tipoCambio")}
          formato={(v) => `$${v.toFixed(2)}`}
        />
        <Campo
          label="CTR estimado"
          ayuda="de cada 100 veces que sale tu anuncio, cuántas reciben clic"
          valor={ctr}
          min={2}
          max={15}
          paso={0.5}
          onChange={setCampo("ctr")}
          formato={(v) => `${v}%`}
        />
        <Campo
          label="Cobertura"
          ayuda="de todas las búsquedas, en cuántas alcanzas a aparecer"
          valor={cobertura}
          min={20}
          max={90}
          paso={5}
          onChange={setCampo("cobertura")}
          formato={(v) => `${v}%`}
        />
        <Campo
          label="Conversión del sitio"
          ayuda="de cada 100 clics, cuántos dejan sus datos"
          valor={conversion}
          min={0.5}
          max={10}
          paso={0.5}
          onChange={setCampo("conversion")}
          formato={(v) => `${v}%`}
        />
      </div>

      <div className="mt-5 grid gap-px overflow-hidden rounded-[var(--crm-r-md)] border border-[var(--crm-line)] bg-[var(--crm-line)] sm:grid-cols-4">
        <Kpi label="Clics al mes" valor={num(clics)} />
        <Kpi label="Leads al mes" valor={num(leads, 1)} destacado />
        <Kpi label="Costo por lead" valor={`$${num(costoLead, 2)} USD`} />
        <Kpi label="Costo por lead" valor={`$${num(costoLeadMxn)} MXN`} />
      </div>

      {topado ? (
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--crm-ink-soft)]">
          <b className="font-medium text-[var(--crm-ink)]">
            Sobra presupuesto: no hay tanta demanda que comprar.
          </b>{" "}
          Con ${num(presupuesto)} al mes pagarías {num(clicsQuePaga)} clics, pero {origen} suman{" "}
          {num(volumen)} búsquedas al mes y de ahí salen unos {num(techo)} clics como techo con esta
          cobertura y CTR. Solo se usan ${num(gastoReal)} y sobran ${num(presupuesto - gastoReal)}.
          Para gastar más, la palanca es subir la puja o la cobertura (ganar más subastas), no el
          presupuesto.
        </p>
      ) : (
        <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--crm-ink-faint)]">
          Techo: {num(techo)} clics al mes ({num(volumen)} búsquedas × {cobertura}% de cobertura ×{" "}
          {ctr}% de CTR). Aritmética sobre el CPC medido, no un pronóstico de Google: el costo real
          depende de la calidad del anuncio y de quién más esté pujando ese mes.
        </p>
      )}
    </div>
  );
}

function Campo({
  label, ayuda, valor, min, max, paso, onChange, formato,
}: {
  label: string;
  ayuda?: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  onChange: (v: number) => void;
  formato: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[13px] text-[var(--crm-ink-soft)]">{label}</label>
        <span className="crm-num text-[13px] font-medium text-[var(--crm-ink)]">
          {formato(valor)}
        </span>
      </div>
      {ayuda && <p className="mb-1 text-[11px] leading-tight text-[var(--crm-ink-faint)]">{ayuda}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full accent-[var(--crm-accent)] ${ayuda ? "" : "mt-1.5"}`}
      />
    </div>
  );
}

function Kpi({ label, valor, destacado }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <div className="bg-[var(--crm-surface-2)] p-3.5">
      <span className="block text-[12px] text-[var(--crm-ink-mute)]">{label}</span>
      <span
        className={`crm-num mt-1 block text-[22px] font-semibold tracking-tight ${
          destacado ? "text-[var(--crm-accent-strong)]" : "text-[var(--crm-ink)]"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}
