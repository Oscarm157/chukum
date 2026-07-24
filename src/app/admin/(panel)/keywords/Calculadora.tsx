"use client";

import { useEffect, useState } from "react";

/**
 * Traduce presupuesto a leads con el CPC de la plaza que se esté viendo.
 * El escenario se guarda: al volver a la pantalla sigue ahí.
 */
const CLAVE = "kw-escenario";

export function Calculadora({ cpcSugerido, plaza }: { cpcSugerido: number; plaza: string }) {
  const [e, setE] = useState({
    presupuesto: 500,
    cpc: cpcSugerido || 1,
    conversion: 2,
    tipoCambio: 18.5,
  });
  const [listo, setListo] = useState(false);
  const { presupuesto, cpc, conversion, tipoCambio } = e;

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

  const clics = cpc > 0 ? presupuesto / cpc : 0;
  const leads = clics * (conversion / 100);
  const costoLead = leads > 0 ? presupuesto / leads : 0;

  const num = (n: number, d = 0) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

  return (
    <div className="crm-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="crm-h2">Cuántos leads salen con este presupuesto</h2>
        <button
          type="button"
          onClick={() => setCampo("cpc")(cpcSugerido)}
          className="crm-btn crm-btn-sm crm-btn-secondary"
        >
          {plaza === "referencia" ? "CPC promedio" : `CPC de ${plaza}`}: ${cpcSugerido.toFixed(2)}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
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
          label="Conversión del sitio"
          valor={conversion}
          min={0.5}
          max={10}
          paso={0.5}
          onChange={setCampo("conversion")}
          formato={(v) => `${v}%`}
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
      </div>

      <div className="mt-5 grid gap-px overflow-hidden rounded-[var(--crm-r-md)] border border-[var(--crm-line)] bg-[var(--crm-line)] sm:grid-cols-4">
        <Kpi label="Clics al mes" valor={num(clics)} />
        <Kpi label="Leads al mes" valor={num(leads, 1)} destacado />
        <Kpi label="Costo por lead" valor={`$${num(costoLead, 2)} USD`} />
        <Kpi label="Costo por lead" valor={`$${num(costoLead * tipoCambio)} MXN`} />
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--crm-ink-faint)]">
        Aritmética simple sobre el CPC medido, no un pronóstico de Google. Sirve para dimensionar,
        no para comprometer presupuesto: el CPC real depende de la calidad del anuncio y de quién
        más esté pujando ese mes.
      </p>
    </div>
  );
}

function Campo({
  label, valor, min, max, paso, onChange, formato,
}: {
  label: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  onChange: (v: number) => void;
  formato: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="text-[13px] text-[var(--crm-ink-soft)]">{label}</label>
        <span className="crm-num text-[13px] font-medium text-[var(--crm-ink)]">
          {formato(valor)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--crm-accent)]"
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
