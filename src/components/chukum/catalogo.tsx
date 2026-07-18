"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MessageCircle, ArrowRight, X } from "lucide-react";
import { SectionHead } from "@/components/chukum/section-head";
import { DEVELOPMENTS, CIUDADES, tiposLabel, type Development } from "@/lib/developments";
import { waLink, STATUS_LABEL } from "@/lib/site";

// Catálogo con filtro por ciudad. Los pills seleccionan 1 o varias ciudades; sin selección
// se muestran todos. El pill "Borrar" limpia la selección completa.
export function Catalogo() {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (ciudad: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ciudad)) next.delete(ciudad);
      else next.add(ciudad);
      return next;
    });

  const visibles =
    selected.size === 0 ? DEVELOPMENTS : DEVELOPMENTS.filter((d) => selected.has(d.ciudad));

  return (
    <>
      <SectionHead index="04" eyebrow="Catálogo" title="Desarrollos disponibles" />

      {/* Pills de ciudad + borrar */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        {CIUDADES.map((ciudad) => {
          const active = selected.has(ciudad);
          return (
            <button
              key={ciudad}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(ciudad)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-cenote text-canvas"
                  : "border border-hairline text-ink-2 hover:border-cenote hover:text-cenote"
              }`}
            >
              {ciudad}
            </button>
          );
        })}
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            aria-label="Borrar filtros"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-4 py-2 text-sm text-ink-2 transition hover:border-cenote hover:text-cenote"
          >
            <X className="h-4 w-4" /> Borrar
          </button>
        )}
      </div>

      {/* Cards filtradas */}
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
    </>
  );
}

// Card de desarrollo, formato image-led uniforme, SIN nombre de proyecto: foto + tipo +
// etapa + ubicación (heading). Alterna el lado de la imagen por índice.
function DevCard({ d, flip }: { d: Development; flip: boolean }) {
  const waMsg = `Hola, me interesa una propiedad ${d.heading.toLowerCase()}. ¿Me pasas disponibilidad y precios?`;
  return (
    <article className="chukum-grain flex flex-col overflow-hidden rounded-3xl border border-hairline bg-surface md:min-h-[340px] md:flex-row">
      <div className={`relative h-60 md:h-auto md:w-1/2 ${flip ? "md:order-2" : ""}`}>
        <Image src={d.image} alt={d.alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
        <span className="absolute left-3 top-3 rounded-full bg-canvas/90 px-3 py-1 text-xs text-ink">
          {STATUS_LABEL[d.etapa]}
        </span>
      </div>
      <div className="flex flex-col justify-center p-7 md:w-1/2 md:p-10">
        <p className="text-xs uppercase tracking-[0.16em] text-cenote">{tiposLabel(d.tipos)}</p>
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
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 rounded-full bg-cenote px-5 py-2.5 text-sm font-medium text-canvas transition hover:bg-cenote-deep"
          >
            Solicitar informes <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={waLink(waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm text-ink transition hover:border-cenote hover:text-cenote"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
