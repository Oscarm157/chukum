"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Clock, ArrowUpRight } from "lucide-react";
import type { TemaGroup } from "@/lib/campus-kb";

export function KbBrowser({ temas }: { temas: TemaGroup[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const totalFichas = useMemo(
    () => temas.reduce((n, t) => n + t.fichas.length, 0),
    [temas]
  );

  const filtered = useMemo(() => {
    if (!q) return temas;
    return temas
      .map((t) => ({
        ...t,
        fichas: t.fichas.filter((f) => f.searchText.includes(q)),
      }))
      .filter((t) => t.fichas.length > 0);
  }, [temas, q]);

  const matches = filtered.reduce((n, t) => n + t.fichas.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      {/* Encabezado */}
      <header className="kb-fade">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
          Campus ORVE
        </p>
        <h1 className="mt-2.5 font-serif text-[2.4rem] leading-[1.05] tracking-tight text-ink sm:text-[3rem]">
          Base de conocimientos
        </h1>
        <p className="mt-3 max-w-xl text-[1.02rem] leading-relaxed text-ink-soft">
          Resúmenes de los videos de capacitación. Cada ficha trae lo esencial:
          resumen, datos clave, puntos a recordar y posibles preguntas.
        </p>
        <p className="mt-2 text-sm text-ink-mute">
          {totalFichas} {totalFichas === 1 ? "ficha" : "fichas"} en {temas.length}{" "}
          {temas.length === 1 ? "tema" : "temas"}.
        </p>
      </header>

      {/* Buscador */}
      <div className="sticky top-0 z-10 -mx-5 mt-8 bg-paper/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, tema o contenido"
            className="w-full rounded-xl border border-line-strong bg-surface py-2.5 pl-10 pr-4 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-accent focus:ring-4 focus:ring-accent-tint"
          />
        </div>
        {q && (
          <p className="mt-2 text-xs text-ink-mute">
            {matches} {matches === 1 ? "resultado" : "resultados"} para &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {/* Contenido */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[168px_1fr] lg:gap-12">
        {/* Rail de temas (jump links) */}
        <nav aria-label="Temas" className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-1">
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-mute">
              Temas
            </p>
            {temas.map((t) => (
              <a
                key={t.temaSlug}
                href={`#${t.temaSlug}`}
                className="rounded-lg px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {t.tema}
                <span className="ml-1.5 text-ink-faint">{t.fichas.length}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Secciones por tema */}
        <div className="min-w-0">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong py-20 text-center">
              <p className="text-[0.95rem] font-medium text-ink">Sin resultados</p>
              <p className="mt-1 text-sm text-ink-mute">
                No hay fichas que coincidan con &ldquo;{query}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {filtered.map((t) => (
                <section key={t.temaSlug} id={t.temaSlug} className="scroll-mt-24">
                  <div className="mb-4 flex items-baseline gap-3 border-b border-line pb-2.5">
                    <h2 className="font-serif text-xl tracking-tight text-ink">{t.tema}</h2>
                    <span className="text-sm text-ink-mute">
                      {t.fichas.length} {t.fichas.length === 1 ? "ficha" : "fichas"}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2.5">
                    {t.fichas.map((f, i) => (
                      <li key={f.slug} className="kb-fade" style={{ animationDelay: `${i * 40}ms` }}>
                        <Link
                          href={`/campus/${f.slug}`}
                          className="group flex gap-4 rounded-2xl border border-line bg-surface p-4 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_10px_30px_-16px_rgba(28,27,24,0.28)] sm:p-5"
                        >
                          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-tint font-serif text-[0.95rem] font-semibold tabular-nums text-accent-ink">
                            {String(f.video).padStart(2, "0")}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-serif text-[1.15rem] leading-snug tracking-tight text-ink">
                                {f.title}
                              </h3>
                              <ArrowUpRight className="mt-1 size-4 shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-mute">
                              {f.tipo && (
                                <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink-soft">
                                  {f.tipo}
                                </span>
                              )}
                              {f.duracion && (
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Clock className="size-3" />
                                  {f.duracion}
                                </span>
                              )}
                            </div>

                            <p className="mt-2 line-clamp-2 text-[0.92rem] leading-relaxed text-ink-soft">
                              {f.excerpt}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
