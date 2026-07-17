import Image from "next/image";
import { MessageCircle, ArrowRight, ShieldCheck, FileCheck2, Droplets } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ChukumNav } from "@/components/chukum/nav";
import { Quiz } from "@/components/chukum/quiz";
import { CaptureForm } from "@/components/chukum/capture-form";
import { DEVELOPMENTS, TIPO_LABEL } from "@/lib/developments";
import { BRAND, waLink, STATUS_LABEL } from "@/lib/site";

const WA_HERO = "Hola, vengo del sitio de Chukum y quiero información de sus desarrollos.";

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Seguridad",
    body: "Yucatán se mantiene como el estado más seguro de México, según múltiples índices nacionales, por sus bajos niveles de delincuencia.",
  },
  {
    icon: FileCheck2,
    title: "Certeza legal",
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
        name: "Desarrollos que comercializa Chukum",
        itemListElement: DEVELOPMENTS.map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: d.name,
          description: `${d.blurb} Ubicación: ${d.place}.`,
        })),
      },
    ],
  };
}

export default function ChukumHome() {
  const featured = DEVELOPMENTS[0];
  const rest = DEVELOPMENTS.slice(1);

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
          poster="/hero/club-playa-progreso.webp"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/hero/hero.webm" type="video/webm" />
          <source src="/hero/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-espresso/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-espresso/85 via-espresso/35 to-transparent" />
        <div className="relative z-10 w-full px-5 pb-20 md:px-10 md:pb-24">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-crema/80">Yucatán · Quintana Roo</p>
            <h1 className="mt-4 font-display text-[12vw] leading-[0.98] tracking-[-0.02em] text-crema md:text-[5.5vw]">
              Invierte en desarrollos de Yucatán y el Caribe
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-crema/85">
              Terrenos, casas y departamentos que comercializo en la península. Responde 4 preguntas y te
              digo cuál encaja contigo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
      </section>

      {/* 2 — Quiz (núcleo del funnel) */}
      <section id="quiz" className="scroll-mt-20 bg-canvas px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cenote">Encuentra tu desarrollo</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.02em] md:text-5xl">
            Cuatro preguntas y te digo cuál encaja
          </h2>
          <p className="mt-4 text-ink-2">
            Sin registro para empezar. Al final dejas tus datos solo si quieres disponibilidad y precios.
          </p>
        </div>
        <div className="mt-10 rounded-3xl border border-hairline bg-surface p-6 md:p-10">
          <Quiz />
        </div>
      </section>

      {/* 3 — Desarrollos (grid asimétrico: Xo'ok destacado + 4) */}
      <section id="desarrollos" className="scroll-mt-20 bg-canvas px-5 pb-20 md:px-10 md:pb-28">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.2em] text-cenote">Catálogo</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[1.05] tracking-[-0.02em] md:text-5xl">
            Desarrollos que comercializo
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Destacado */}
          <Reveal>
            <article className="chukum-grain group flex h-full flex-col overflow-hidden rounded-3xl border border-hairline bg-surface md:col-span-2 md:flex-row">
              <div className="relative h-60 md:h-auto md:w-1/2">
                <Image
                  src={featured.image}
                  alt={featured.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center p-7 md:w-1/2 md:p-10">
                <p className="text-xs uppercase tracking-[0.16em] text-ink-2">{featured.place}</p>
                <h3 className="mt-1 font-display text-3xl tracking-[-0.02em] md:text-4xl">{featured.name}</h3>
                <p className="mt-3 max-w-md leading-relaxed text-ink-2">{featured.blurb}</p>
                {featured.specs && (
                  <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                    {featured.specs.map((s) => (
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
                    href={waLink(`Hola, me interesa ${featured.name}. ¿Me pasas disponibilidad y precios?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm text-ink transition hover:border-cenote hover:text-cenote"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </div>
            </article>
          </Reveal>

          {/* Resto */}
          {rest.map((d) => (
            <Reveal key={d.slug}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-hairline bg-surface">
                <div className="relative h-52">
                  <Image src={d.image} alt={d.alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                  <span className="absolute left-3 top-3 rounded-full bg-canvas/90 px-3 py-1 text-xs text-ink">
                    {STATUS_LABEL[d.etapa]}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-2">{d.place}</p>
                  <h3 className="mt-1 font-display text-2xl tracking-[-0.02em]">{d.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{d.blurb}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.tipos.map((t) => (
                      <span key={t} className="rounded-full border border-hairline bg-canvas px-2.5 py-1 text-xs text-ink-2">
                        {TIPO_LABEL[t]}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex gap-3 pt-1">
                    <a href="#contacto" className="inline-flex items-center gap-1.5 text-sm font-medium text-cenote transition hover:text-cenote-deep">
                      Solicitar informes <ArrowRight className="h-4 w-4" />
                    </a>
                    <a
                      href={waLink(`Hola, me interesa ${d.name}. ¿Me pasas disponibilidad y precios?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-ink-2 transition hover:text-cenote"
                      aria-label={`WhatsApp sobre ${d.name}`}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4 — Por qué Yucatán (banda espresso + grano) */}
      <section id="por-que" className="chukum-grain scroll-mt-20 bg-espresso px-5 py-24 text-crema md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.2em] text-crema/60">Por qué invertir</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[1.05] tracking-[-0.02em] md:text-5xl">
              Seguridad, certeza legal y agua
            </h2>
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
            <p className="text-sm uppercase tracking-[0.2em] text-cenote">Respaldo</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[1.05] tracking-[-0.02em] md:text-5xl">
              Comunidades entregadas, no promesas
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">
              Comercializo desarrollos de una desarrolladora con comunidades planeadas ya entregadas en
              Yucatán y Quintana Roo. Los números son de proyectos reales en operación.
            </p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-3">
            <Stat value="6,000+" label="Unidades en Ciudad Central Mérida, 9 etapas" />
            <Stat value="3,800+" label="Unidades en Ciudad Central Progreso, 6 etapas" />
            <Stat value="2 estados" label="Desarrollos entregados en Yucatán y Quintana Roo" />
          </div>
        </div>
      </section>

      {/* 6 — Contacto */}
      <section id="contacto" className="scroll-mt-20 bg-surface-warm px-5 py-24 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-2 md:gap-20">
          <Reveal>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cenote">Contacto</p>
              <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.02em] md:text-5xl">
                Te digo qué hay disponible y a qué precio
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-ink-2">
                Déjame tus datos o escríbeme por WhatsApp. Te paso la disponibilidad y los precios directo
                del desarrollador.
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
                Comercialización de desarrollos inmobiliarios en la península de Yucatán: terrenos, casas y
                departamentos.
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
            Chukum comercializa desarrollos de terceros. Los desarrollos se nombran por su nombre propio;
            precios y disponibilidad se confirman directo con el desarrollador.
          </p>
        </div>
      </footer>
    </main>
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
