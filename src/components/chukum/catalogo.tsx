"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MessageCircle, ArrowRight, X } from "lucide-react";
import { SectionHead } from "@/components/chukum/section-head";
import { ciudadesDe, TIPO_LABEL, type Development, type Tipo } from "@/lib/developments";
import { waLink, STATUS_LABEL } from "@/lib/site";
import { PropertyTypeBadges } from "@/components/chukum/property-type-badges";

function toggleInSet<T>(setFn: (updater: (prev: Set<T>) => Set<T>) => void, value: T) {
  setFn((prev) => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  });
}

// Catálogo con filtro por ciudad y por tipo. Los pills seleccionan 1 o varias opciones por
// filtro; sin selección se muestran todos. Ambos filtros combinan con AND entre sí. El pill
// "Borrar" limpia las dos selecciones.
export function Catalogo({ developments }: { developments: Development[] }) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedTipos, setSelectedTipos] = useState<Set<Tipo>>(new Set());
  const ciudades = ciudadesDe(developments);
  const tipos = (Object.keys(TIPO_LABEL) as Tipo[]).filter((t) =>
    developments.some((d) => d.tipos.includes(t))
  );

  const toggle = (ciudad: string) => toggleInSet(setSelected, ciudad);
  const toggleTipo = (t: Tipo) => toggleInSet(setSelectedTipos, t);

  const visibles = developments.filter((d) => {
    const matchCiudad = selected.size === 0 || selected.has(d.ciudad);
    const matchTipo = selectedTipos.size === 0 || d.tipos.some((t) => selectedTipos.has(t));
    return matchCiudad && matchTipo;
  });
  const hayFiltros = selected.size > 0 || selectedTipos.size > 0;

  return (
    <>
      <SectionHead index="04" eyebrow="Catálogo" title="Desarrollos disponibles" />

      {/* Pills de ciudad + borrar */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <span className="mr-1 text-xs uppercase tracking-[0.16em] text-ink-2">Filtrar por ciudad</span>
        {ciudades.map((ciudad) => {
          const active = selected.has(ciudad);
          return (
            <button
              key={ciudad}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(ciudad)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-cenote text-canvas shadow-sm"
                  : "border-2 border-[var(--chukum)] text-ink hover:border-cenote hover:text-cenote"
              }`}
            >
              {ciudad}
            </button>
          );
        })}
      </div>

      {/* Pills de tipo + borrar */}
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <span className="mr-1 text-xs uppercase tracking-[0.16em] text-ink-2">Filtrar por tipo</span>
        {tipos.map((t) => {
          const active = selectedTipos.has(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              onClick={() => toggleTipo(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-cenote text-canvas shadow-sm"
                  : "border-2 border-[var(--chukum)] text-ink hover:border-cenote hover:text-cenote"
              }`}
            >
              {TIPO_LABEL[t]}
            </button>
          );
        })}
        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              setSelected(new Set());
              setSelectedTipos(new Set());
            }}
            aria-label="Borrar filtros"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-4 py-2 text-sm text-ink-2 transition hover:border-cenote hover:text-cenote"
          >
            <X className="h-4 w-4" /> Borrar
          </button>
        )}
      </div>

      {/* Cards filtradas */}
      {visibles.length === 0 ? (
        <p className="mt-10 text-ink-2">
          {developments.length === 0
            ? "Pronto publicaremos los desarrollos disponibles."
            : "No hay desarrollos con ese filtro."}
        </p>
      ) : (
        <div className="mt-10 flex flex-col gap-5">
          <AnimatePresence mode="popLayout" initial={false}>
          {visibles.map((d, i) => (
            <motion.div
              key={d.slug}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <DevCard d={d} flip={i % 2 === 1} />
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

// Card de desarrollo, formato image-led uniforme, SIN nombre de proyecto: foto + tipo +
// etapa + ubicación (heading). Alterna el lado de la imagen por índice. Los `demo` (vendidos/
// entregados) llevan tag "Ejemplo" y no enlazan a detalle: son referencia, no inventario.
function DevCard({ d, flip }: { d: Development; flip: boolean }) {
  const waMsg = `Hola, me interesa una propiedad ${d.heading.toLowerCase()}. ¿Me pasas disponibilidad y precios?`;
  const detalleHref = `/vivir-en-merida/desarrollos/${d.slug}`;
  return (
    <article className="chukum-grain flex flex-col overflow-hidden rounded-3xl border-2 border-[var(--chukum)] bg-surface md:min-h-[340px] md:flex-row">
      <div className={`relative h-60 md:h-auto md:w-1/2 ${flip ? "md:order-2" : ""}`}>
        <Image src={d.image} alt={d.alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
        {d.demo ? (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500/95 px-3 py-1 text-xs font-medium text-white">
            Ejemplo
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-canvas/90 px-3 py-1 text-xs text-ink">
            {STATUS_LABEL[d.etapa]}
          </span>
        )}
      </div>
      <div className="flex flex-col justify-center p-7 md:w-1/2 md:p-10">
        <PropertyTypeBadges tipos={d.tipos} className="mb-1" />
        <h3 className="mt-1 font-display text-3xl tracking-[-0.02em] md:text-4xl">{d.heading}</h3>
        <p className="mt-3 max-w-md leading-relaxed text-ink-2">{d.blurb}</p>
        {d.specs && (
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {d.specs.map((s) => (
              <div key={s.label}>
                <dt className="text-xs uppercase tracking-[0.14em] text-ink-2">{s.label}</dt>
                <dd className="font-display text-xl tracking-[-0.01em]">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {d.demo ? (
          <p className="mt-6 text-sm text-ink-2">Proyecto ya entregado. Se muestra como ejemplo de lo que se comercializa.</p>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={detalleHref}
              className="inline-flex items-center gap-2 rounded-full bg-cenote px-5 py-2.5 text-sm font-medium text-canvas transition hover:bg-cenote-deep"
            >
              Ver desarrollo <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={waLink(waMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm text-ink transition hover:border-cenote hover:text-cenote"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
