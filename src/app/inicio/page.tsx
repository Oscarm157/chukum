import Image from "next/image";
import { MessageCircle, ArrowRight, ShieldCheck, FileCheck2, Droplets } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ChukumNav } from "@/components/chukum/nav";
import { Quiz } from "@/components/chukum/quiz";
import { Mosaic } from "@/components/chukum/mosaic";
import { CaptureForm } from "@/components/chukum/capture-form";
import { DEVELOPMENTS, tiposLabel, type Development } from "@/lib/developments";
import { BRAND, waLink, STATUS_LABEL } from "@/lib/site";

const WA_HERO = "Hola, vi el sitio de Chukum y quiero que me pases info de casas, terrenos o departamentos.";

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Seguridad",
    body: "Yucatán se mantiene como el estado más seguro de México, según múltiples índices nacionales, por sus bajos niveles de delincuencia.",
  },
  {
    icon: FileCheck2,
    title: "Papeles en regla",
    body: "Cada desarrollo del catálogo cuenta con permisos municipales y estatales y propiedad legal de los terrenos, documentación que revisas antes de firmar.",
  },
  {
    icon: Droplets,
    title: "Riqueza hídrica",
    body: "Yucatán tiene una de las reservas de agua subterránea más importantes del país, por su red de cenotes y acuíferos naturales.",
  },
];

function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateAgent",
        name: BRAND.name,
        url: BRAND.url,
        areaServed: "Península de Yucatán, México",
      },
      {
        "@type": "ItemList",
        name: "Propiedades disponibles en la península de Yucatán",
        itemListElement: DEVELOPMENTS.map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${tiposLabel(d.tipos)}, ${d.heading.toLowerCase()}`,
          description: d.blurb,
        })),
      },
    ],
  };
}

export default function ChukumHome() {
  return (
    <main id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <ChukumNav />

      {/* 1 — Hero full-bleed (video real) */}
      <section className="relative flex h-[100dvh] min-h-[620px] w-full items-end overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero/hero-poster.webp"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/hero/hero.webm" type="video/webm" />
          <source src="/hero/hero.mp4" type="video/mp4" />
        </video>
        {/* Gradiente suave arriba (para el nav) y scrim SOLO en la franja inferior:
            la mitad de arriba del video queda limpia y brillante. */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-espresso/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-espresso/90 via-espresso/55 to-transparent md:h-[50%]" />

        {/* Franja horizontal al pie: la imagen luce, el contenido vive abajo. El kicker
            con índice conserva el hilo editorial. */}
        <div className="relative z-10 w-full px-5 pb-24 md:px-10 md:pb-12">
          <div className="mx-auto max-w-[1400px] border-t border-crema/15 pt-6">
            <div className="flex items-center gap-3 text-crema/85">
              <span className="font-display text-base leading-none">01</span>
              <span className="h-px w-10 bg-crema/40" />
              <span className="text-xs uppercase tracking-[0.24em]">Península de Yucatán</span>
            </div>
            <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
              <div className="max-w-3xl">
                <h1 className="font-display text-3xl leading-[1.03] tracking-[-0.02em] text-crema md:text-[3.2rem] md:leading-[1.0]">
                  Tu casa, terreno o departamento en la península de Yucatán
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-crema/85">
                  Hay muchos desarrollos y es fácil perderse. Contesta unas preguntas y ves las que
                  van contigo.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:pb-1">
                <a
                  href="#quiz"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cenote px-7 py-3.5 text-sm font-medium text-canvas transition hover:bg-cenote-deep"
                >
                  Encuentra tu desarrollo <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#desarrollos"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-crema/40 px-7 py-3.5 text-sm text-crema transition hover:bg-crema/10"
                >
                  Ver desarrollos
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Abanico de opciones (animación de scroll) */}
      <section className="bg-canvas px-5 pt-20 md:px-10 md:pt-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionHead index="02" eyebrow="Opciones" title="Terrenos, casas y departamentos en distintas zonas" />
          <p className="mt-4 max-w-xl text-ink-2">
            Desde la selva y el norte de Mérida hasta la costa y el Caribe, en distintos presupuestos
            y etapas.
          </p>
        </div>
      </section>
      <Mosaic heroSrc="/hero/familia-playa-wide.webp" heroAlt="Playa en la costa de Yucatán" />

      {/* 3 — Quiz (núcleo del funnel) */}
      <section id="quiz" className="scroll-mt-20 bg-canvas px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionHead index="03" eyebrow="El test" title="Contesta unas preguntas y ves las que van contigo" />
          <p className="mt-4 max-w-xl text-ink-2">
            Son cuatro preguntas: zona, tipo de propiedad y en qué etapa está. Si algo te interesa,
            me dejas tus datos y seguimos por WhatsApp.
          </p>
          <div className="mt-10 rounded-3xl border border-hairline bg-surface p-6 md:p-10">
            <Quiz />
          </div>
        </div>
      </section>

      {/* 3 — Desarrollos (grid asimétrico: Xo'ok destacado + 4) */}
      <section id="desarrollos" className="scroll-mt-20 bg-canvas px-5 pb-20 md:px-10 md:pb-28">
        <Reveal>
          <SectionHead index="04" eyebrow="Catálogo" title="Los desarrollos que manejo" />
        </Reveal>

        <div className="mt-10 flex flex-col gap-5">
          {DEVELOPMENTS.map((d, i) => (
            <Reveal key={d.slug}>
              <DevCard d={d} flip={i % 2 === 1} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4 — Por qué Yucatán (banda espresso + grano) */}
      <section id="por-que" className="chukum-grain scroll-mt-20 bg-espresso px-5 py-24 text-crema md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHead index="05" eyebrow="Por qué aquí" title="Seguridad, papeles en regla y agua" dark />
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {VALUE_PROPS.map((v) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title}>
                  <div className="border-t border-crema/20 pt-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cenote/20 text-cenote">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-2xl tracking-[-0.01em]">{v.title}</h3>
                    <p className="mt-3 leading-relaxed text-crema/75">{v.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5 — Respaldo (cifras reales, sin nombrar al desarrollador) */}
      <section className="bg-canvas px-5 py-24 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <SectionHead index="06" eyebrow="Respaldo" title="Esto ya está entregado y funcionando" />
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
              Los desarrollos que te muestro son de una constructora que ya tiene comunidades enteras
              entregadas y en operación en Yucatán y Quintana Roo. Estos números son de proyectos que
              ya funcionan.
            </p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-3">
            <Stat value="6,000+" label="Unidades entregadas en una comunidad del norte de Mérida" />
            <Stat value="3,800+" label="Unidades en una comunidad frente al mar en Progreso" />
            <Stat value="2 estados" label="Desarrollos entregados en Yucatán y Quintana Roo" />
          </div>
        </div>
      </section>

      {/* 6 — Contacto */}
      <section id="contacto" className="scroll-mt-20 bg-surface-warm px-5 py-24 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-2 md:gap-20">
          <Reveal>
            <div>
              <SectionHead index="07" eyebrow="Contacto" title="Cuéntame qué buscas y te ayudo" />
              <p className="mt-4 max-w-md leading-relaxed text-ink-2">
                Déjame tus datos o escríbeme por WhatsApp. Te paso disponibilidad y precios directo de
                quien lo construye.
              </p>
              <a
                href={waLink(WA_HERO)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-cenote px-6 py-3 text-sm font-medium text-canvas transition hover:bg-cenote-deep"
              >
                <MessageCircle className="h-4 w-4" /> Escríbeme por WhatsApp
              </a>
            </div>
          </Reveal>
          <CaptureForm cta="Solicitar informes" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-espresso px-5 pb-28 pt-16 text-crema/70 md:px-10 md:pb-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-8 border-b border-crema/15 pb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] text-crema">CHUKUM</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed">
                Casas, terrenos y departamentos en Yucatán y Quintana Roo. Te ayudo a encontrar el que va
                contigo.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <a href="#quiz" className="transition hover:text-crema">Encuentra tu desarrollo</a>
              <a href="#desarrollos" className="transition hover:text-crema">Desarrollos</a>
              <a href="#por-que" className="transition hover:text-crema">Por qué Yucatán</a>
              <a href="#contacto" className="transition hover:text-crema">Contacto</a>
            </nav>
          </div>
          <p className="mt-8 text-xs leading-relaxed text-crema/50">
            Chukum te conecta con desarrollos de terceros. Te paso los detalles, disponibilidad y
            precios directo por WhatsApp o correo.
          </p>
        </div>
      </footer>
    </main>
  );
}

// Encabezado editorial consistente: índice (hilo 01/02/03…) + hairline + eyebrow + título.
// El mismo lenguaje del hero, repetido en cada sección para que el sitio se sienta uno.
function SectionHead({
  index,
  eyebrow,
  title,
  dark = false,
}: {
  index: string;
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={`font-display text-base leading-none ${dark ? "text-crema/70" : "text-ink-2"}`}>
          {index}
        </span>
        <span className={`h-px w-10 ${dark ? "bg-crema/30" : "bg-hairline"}`} />
        <span className={`text-xs uppercase tracking-[0.24em] ${dark ? "text-crema/70" : "text-cenote"}`}>
          {eyebrow}
        </span>
      </div>
      <h2
        className={`mt-4 max-w-2xl font-display text-4xl leading-[1.05] tracking-[-0.02em] md:text-5xl ${
          dark ? "text-crema" : ""
        }`}
      >
        {title}
      </h2>
    </div>
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-canvas px-7 py-10">
      <p className="font-display text-5xl tracking-[-0.03em] text-ink">{value}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{label}</p>
    </div>
  );
}
