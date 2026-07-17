import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/vivir/site-nav";
import { SiteFooter } from "@/components/vivir/footer";
import { Reveal } from "@/components/vivir/reveal";
import { ParallaxImage } from "@/components/vivir/parallax-image";
import { ContactForm } from "@/components/vivir/contact-form";
import { WhatsAppButton } from "@/components/vivir/whatsapp-button";
import { JsonLd } from "@/components/vivir/json-ld";
import { organizationJsonLd } from "@/lib/seo";
import { STATUS_LABEL } from "@/lib/site";
import {
  getZonasPublicadas,
  getDevelopmentBySlug,
  getDevelopmentsByZona,
  getDevelopmentImages,
} from "@/lib/queries";

// Fuentes cualitativas defendibles (sin cifras inventadas). Yucatán encabeza las
// encuestas nacionales de percepción de seguridad; el norte es el corredor de
// crecimiento de Mérida (ver descripcion_es de la zona en DB).
const NORTE_STATS = [
  {
    token: "1º",
    title: "Estado más seguro de México",
    body: "Yucatán encabeza las encuestas nacionales de percepción de seguridad (INEGI, ENSU).",
  },
  {
    token: "Norte",
    title: "El corredor que más crece",
    body: "Donde se concentra la vivienda nueva y la inversión en terreno dentro de Mérida.",
  },
  {
    token: "Periférico",
    title: "Conectado a todo",
    body: "A minutos de plazas comerciales, universidades y hospitales por el anillo periférico.",
  },
];

export default async function HomePage() {
  const [zonas, dev] = await Promise.all([
    getZonasPublicadas(),
    getDevelopmentBySlug("ciudad-central-merida"),
  ]);
  const devHero = dev ? (await getDevelopmentImages(dev.id))[0] : undefined;
  const leadZona = zonas[0];
  const leadZonaDevs = leadZona ? await getDevelopmentsByZona(leadZona.id) : [];
  const leadZonaImage = leadZonaDevs[0]
    ? (await getDevelopmentImages(leadZonaDevs[0].id))[0]
    : undefined;

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <SiteNav />
      <main id="top" className="bg-canvas text-ink">
        {/* (a) Hero full-bleed cinematográfico */}
        <section className="relative flex h-[100dvh] min-h-[620px] w-full items-end overflow-hidden">
          <ParallaxImage
            src="/hero/merida-plaza-grande.webp"
            alt="Centro de Mérida, Yucatán, al atardecer"
            priority
            className="absolute inset-0 h-full w-full"
            amount={70}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-espresso/40" />
          <div className="relative z-10 w-full px-6 pb-16 md:px-10 md:pb-24">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.22em] text-crema/80">
                Mérida · Yucatán
              </p>
            </Reveal>
            <Reveal>
              <h1 className="mt-4 max-w-[15ch] font-display text-[13vw] font-light leading-[0.92] tracking-[-0.03em] text-crema md:text-[6.5vw]">
                Vivir en el norte de Mérida
              </h1>
            </Reveal>
            <Reveal>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-crema/85">
                Guía de zonas y desarrollos para comprar terreno, casa o departamento en el
                corredor de mayor crecimiento de la ciudad. Directo con el desarrollador.
              </p>
            </Reveal>
            <Reveal>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {leadZona && (
                  <Link
                    href={`/vivir-en-merida/zonas/${leadZona.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-crema px-6 py-3 text-sm text-espresso transition hover:bg-white"
                  >
                    Explorar {leadZona.nombre}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 rounded-full border border-crema/40 px-6 py-3 text-sm text-crema transition hover:bg-crema/10"
                >
                  Solicitar informes
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* (b) Banda oscura espresso: por qué el norte, stats en terracota */}
        <section className="relative overflow-hidden bg-espresso text-crema">
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/hero/merida-catedral.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/90 to-espresso/40" />
          <div className="relative mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.22em] text-terracota">
                Por qué el norte
              </p>
            </Reveal>
            <Reveal>
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-6xl">
                Se compra por seguridad, crecimiento y conexión, no por especular.
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
              {NORTE_STATS.map((s) => (
                <Reveal key={s.title}>
                  <div className="h-full bg-espresso p-8">
                    <p className="font-mono text-4xl leading-none text-terracota md:text-5xl">
                      {s.token}
                    </p>
                    <p className="mt-5 font-display text-xl tracking-[-0.01em]">{s.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-crema/70">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="mt-6 text-xs text-crema/50">
              Fuentes cualitativas: encuestas nacionales de percepción de seguridad (INEGI) y perfil
              de mercado del corredor norte de Mérida. Precios y plusvalía se confirman por desarrollo.
            </p>
          </div>
        </section>

        {/* (c) Índice de zonas, image-led asimétrico (una zona líder + escala a N) */}
        <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-terracota">Zonas</p>
                <h2 className="mt-3 font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-6xl">
                  Dónde comprar en Yucatán
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-ink-2">
                Publicamos una zona solo cuando hay un desarrollo real detrás. Sumamos zonas del
                interior y la costa conforme verificamos cada uno.
              </p>
            </div>
          </Reveal>

          {leadZona ? (
            <Reveal>
              <Link
                href={`/vivir-en-merida/zonas/${leadZona.slug}`}
                className="group mt-12 block overflow-hidden rounded-3xl border border-hairline bg-surface"
              >
                <div className="grid md:grid-cols-2">
                  <div className="relative min-h-[320px] overflow-hidden md:min-h-[460px]">
                    <Image
                      src={leadZonaImage?.url ?? "/hero/merida-plaza-grande.webp"}
                      alt={leadZonaImage?.alt ?? `Desarrollo en ${leadZona.nombre}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-8 p-8 md:p-12">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-2">
                        Zona 01
                      </p>
                      <h3 className="mt-3 font-display text-3xl tracking-[-0.02em] md:text-5xl">
                        {leadZona.nombre}
                      </h3>
                      <p className="mt-5 max-w-md leading-relaxed text-ink-2">
                        {leadZona.descripcionEs}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm text-terracota">
                      Ver la zona y sus desarrollos
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ) : (
            <p className="mt-12 text-ink-2">Aún no hay zonas publicadas.</p>
          )}
        </section>

        {/* (d) Teaser del desarrollo, split editorial (familia distinta a la de zonas) */}
        {dev && (
          <section className="border-y border-hairline bg-surface-warm">
            <div className="mx-auto grid max-w-[1440px] gap-0 md:grid-cols-[0.9fr_1.1fr]">
              <div className="flex flex-col justify-center gap-6 px-6 py-16 md:px-12 md:py-24">
                <Reveal>
                  <p className="text-xs uppercase tracking-[0.22em] text-terracota">
                    Desarrollo{dev.statusMarketing ? ` · ${STATUS_LABEL[dev.statusMarketing] ?? dev.statusMarketing}` : ""}
                  </p>
                </Reveal>
                <Reveal>
                  <h2 className="font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-5xl">
                    {dev.name}
                  </h2>
                </Reveal>
                <Reveal>
                  <p className="max-w-md leading-relaxed text-ink-2">{dev.descriptionEs}</p>
                </Reveal>
                <Reveal>
                  <div className="flex flex-wrap gap-2">
                    {dev.propertyTypes?.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-hairline bg-canvas px-3 py-1 text-xs capitalize text-ink-2"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Reveal>
                <Reveal>
                  <Link
                    href={`/vivir-en-merida/desarrollos/${dev.slug}`}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-canvas transition hover:bg-terracota-deep"
                  >
                    Ver desarrollo
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Reveal>
              </div>
              <div className="relative min-h-[360px] md:min-h-full">
                <Image
                  src={devHero?.url ?? "/desarrollos/ciudad-central-merida/masterplan.jpg"}
                  alt={devHero?.alt ?? dev.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 55vw"
                  className="object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* (e) Cierre / contacto */}
        <section id="contacto" className="mx-auto max-w-[1440px] scroll-mt-24 px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <Reveal>
                <p className="text-xs uppercase tracking-[0.22em] text-terracota">Contacto</p>
              </Reveal>
              <Reveal>
                <h2 className="mt-4 font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-6xl">
                  Te decimos qué hay disponible y a qué precio.
                </h2>
              </Reveal>
              <Reveal>
                <p className="mt-6 max-w-md leading-relaxed text-ink-2">
                  Escríbenos con lo que buscas. Terreno, casa o departamento en el norte de Mérida:
                  te pasamos disponibilidad y precios actuales, directo del desarrollador.
                </p>
              </Reveal>
              <Reveal>
                <div className="mt-8">
                  <WhatsAppButton
                    message="Hola, quiero información de desarrollos en el norte de Mérida."
                    label="Prefiero WhatsApp"
                    variant="outline"
                  />
                </div>
              </Reveal>
            </div>
            <Reveal>
              <ContactForm contextLabel="desarrollos en el norte de Mérida" />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
