import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllFichas, getFicha, getFichaNeighbors, parseQA } from "@/lib/campus-kb";
import { QaAccordion } from "@/components/campus/qa-accordion";

export function generateStaticParams() {
  return getAllFichas().map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ficha = getFicha(slug);
  return {
    title: ficha ? `${ficha.title} · Campus Chukum` : "Ficha · Campus Chukum",
    robots: { index: false, follow: false },
  };
}

const QA_HEADING = "posibles preguntas de evaluacion";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default async function FichaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ficha = getFicha(slug);
  if (!ficha) notFound();

  const { prev, next } = getFichaNeighbors(slug);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-8 sm:px-6 sm:pt-12">
      <Link
        href="/campus"
        className="inline-flex items-center gap-1.5 text-sm text-ink-mute transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Base de conocimientos
      </Link>

      <article className="kb-fade mt-8">
        <header>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <Link
              href={`/campus#${ficha.temaSlug}`}
              className="font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:text-accent-soft"
            >
              {ficha.tema}
            </Link>
            <span className="text-ink-faint">·</span>
            <span className="font-mono tabular-nums text-ink-mute">
              Video {String(ficha.video).padStart(2, "0")}
            </span>
          </div>

          <h1 className="mt-3 font-serif text-[2.1rem] leading-[1.1] tracking-tight text-ink sm:text-[2.6rem]">
            {ficha.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-ink-mute">
            {ficha.tipo && (
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-ink-soft">
                {ficha.tipo}
              </span>
            )}
            {ficha.duracion && (
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Clock className="size-3.5" />
                {ficha.duracion}
              </span>
            )}
          </div>
        </header>

        <div className="mt-10 flex flex-col gap-10">
          {ficha.sections.map((section, i) => {
            const key = normalize(section.heading);
            const isQA = key === QA_HEADING;
            const isFacts = key === "datos clave";

            return (
              <section key={i}>
                <h2 className="mb-3.5 font-serif text-[1.35rem] tracking-tight text-ink">
                  {section.heading}
                </h2>

                {isQA ? (
                  <QaAccordion items={parseQA(section.body)} />
                ) : (
                  <div className={`reader ${isFacts ? "reader-facts" : ""}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.body}
                    </ReactMarkdown>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </article>

      {/* Navegacion dentro del tema */}
      {(prev || next) && (
        <nav className="mt-14 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/campus/${prev.slug}`}
              className="group flex flex-col rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:items-start"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute">
                <ArrowLeft className="size-3.5" />
                Anterior
              </span>
              <span className="mt-1 font-serif text-[1.02rem] leading-snug text-ink transition-colors group-hover:text-accent">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/campus/${next.slug}`}
              className="group flex flex-col rounded-2xl border border-line bg-surface p-4 text-right transition-colors hover:border-line-strong sm:items-end"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute">
                Siguiente
                <ArrowRight className="size-3.5" />
              </span>
              <span className="mt-1 font-serif text-[1.02rem] leading-snug text-ink transition-colors group-hover:text-accent">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
