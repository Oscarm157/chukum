import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { PinnedMosaic } from "@/components/pinned-mosaic";
import { StackedReveal, type StackSlide } from "@/components/stacked-reveal";
import { ValuePropsCarousel } from "@/components/value-props-carousel";
import { DevelopmentsCarousel } from "@/components/developments-carousel";

const VALUE_CARDS = [
  {
    title: "Seguridad",
    body: "Yucatán se mantiene como el estado más seguro de México, según múltiples índices nacionales, gracias a sus bajos niveles de delincuencia.",
    image: "/hero/orve-card-seguridad.webp",
    alt: "Centro histórico de Mérida, Yucatán",
  },
  {
    title: "Certeza legal",
    body: "Cada desarrollo del catálogo cuenta con permisos municipales y estatales y propiedad legal de los terrenos, documentación que revisas antes de firmar.",
    image: "/hero/orve-card-certeza-legal.webp",
    alt: "Documentación de un desarrollo inmobiliario",
  },
  {
    title: "Riqueza hídrica",
    body: "Yucatán tiene una de las reservas de agua subterránea más importantes de México, gracias a su red de cenotes y acuíferos naturales.",
    image: "/hero/orve-card-riqueza-hidrica.webp",
    alt: "Cenote en la selva de Yucatán",
  },
] as const;

const XOOK_STACK: StackSlide[] = [
  {
    src: "/hero/orve-cenote.webp",
    alt: "Cenote en la selva de Yucatán",
    eyebrow: "El origen",
    title: "Dzonot, portales de agua cristalina",
    body: "En lo profundo de la selva maya, una antigua cultura creía en puertas sagradas que conectaban este mundo con el inframundo: los cenotes, fuentes de vida y de renovación.",
  },
  {
    src: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club Xenotikal en Xo'ok, Yucatán",
    eyebrow: "Xenotikal",
    title: "Un santuario moderno",
    body: "Inspirado en los misterios del cenote, Xenotikal es mucho más que una casa club: un santuario construido sobre la idea de que la sanación no es solo física, sino también espiritual.",
  },
  {
    eyebrow: "Xo'ok",
    title: "Vive en equilibrio con el lujo y la naturaleza",
    body: "Un desarrollo con 7 exclusivas etapas residenciales, diseñado para brindar confort y calidad de vida.",
    specs: [
      { label: "Aparta con", value: "$10,000 MXN" },
      { label: "Enganche", value: "25%" },
      { label: "Etapas", value: "7" },
      { label: "Parque central", value: "413 m" },
    ],
    disclaimer:
      "*Aplican restricciones. Cifras de marketing publicadas por el desarrollador, no son inventario verificado.",
  },
];

const DEVELOPMENTS = [
  {
    name: "Xo'ok",
    place: "Yucatán · selva maya",
    image: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club Xenotikal, desarrollo Xo'ok",
  },
  {
    name: "Ciudad Central Mérida",
    place: "Mérida, Yucatán",
    image: "/hero/orve-ccm-casa-club.webp",
    alt: "Casa club y alberca, Ciudad Central Mérida",
  },
  {
    name: "Ciudad Central Progreso",
    place: "Progreso, Yucatán · frente al mar",
    image: "/hero/orve-ccp-pabellon.webp",
    alt: "Acceso del desarrollo Ciudad Central Progreso",
  },
  {
    name: "Ukana Playa del Carmen",
    place: "Playa del Carmen, Quintana Roo",
    image: "/hero/orve-ukana-pdc-alberca.webp",
    alt: "Alberca entregada, Ukana Playa del Carmen",
  },
  {
    name: "Tulum Ha",
    place: "Tulum, Quintana Roo · en construcción",
    image: "/hero/orve-tulum-ha-avance.webp",
    alt: "Avance de obra real, Tulum Ha",
  },
] as const;

export default function HomePage() {
  return (
    <main id="top" className="bg-cream text-obsidian">
      {/* Hero — video real (Kling, image-to-video del render del club de playa), headline partido */}
      <section className="relative flex h-[100dvh] min-h-[640px] w-full items-end overflow-hidden">
        <SiteNav />
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero/orve-club-playa-progreso.webp"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/hero/orve-hero.webm" type="video/webm" />
          <source src="/hero/orve-hero.mp4" type="video/mp4" />
        </video>
        {/* Foto/video real de cielo claro: sin tinte el nav y el headline no se leen (regla
            Lightship de DESIGN.md: sin overlay primero, se agrega solo si no hay legibilidad) */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="relative z-10 grid w-full grid-cols-1 gap-6 px-6 pb-16 md:grid-cols-2 md:px-10 md:pb-20">
          <h1 className="text-[13vw] font-normal leading-[0.95] tracking-[-0.03em] text-white md:text-[4.5vw]">
            Explora las oportunidades de inversión inmobiliaria
          </h1>
          <h1 className="text-[13vw] font-normal leading-[0.95] tracking-[-0.03em] text-white md:text-right md:text-[4.5vw]">
            en el tesoro escondido de México
          </h1>
        </div>
      </section>

      {/* Mosaico pineado — el hero se encoge a un card mientras 4 fotos reales entran dispersas */}
      <PinnedMosaic
        heroSrc="/hero/orve-club-playa-progreso.webp"
        heroAlt="Villa y club de playa frente al mar, Ciudad Central Progreso"
      />

      {/* Xo'ok — headline fijo + stack de fotos apilándose (mito del cenote → Xenotikal → specs) */}
      <div id="xook">
        <StackedReveal backdropHeadline="Xo'ok" slides={XOOK_STACK} />
      </div>

      {/* Por qué invertir — carrusel: cada card es la foto regional real, su etiqueta de marketing
          quemada ("Yucatán Estado Seguro" / "Certeza Legal" / "Riqueza Hídrica") es el título */}
      <section id="por-que-invertir" className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-[100px]">
        <Reveal>
          <p className="text-sm tracking-[0.2em] text-pebble uppercase">¿Por qué invertir?</p>
        </Reveal>
        <Reveal>
          <div className="mt-16">
            <ValuePropsCarousel items={VALUE_CARDS} />
          </div>
        </Reveal>
      </section>

      {/* Banda cinematográfica — estilo de vida real (familia en playa), único respiro full-bleed */}
      <Reveal>
        <section className="relative h-[60vh] min-h-[380px] w-full overflow-hidden">
          <Image
            src="/hero/orve-familia-playa-wide.webp"
            alt="Familia disfrutando la playa en Yucatán"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:px-10 md:pb-14">
            <p className="text-sm tracking-[0.2em] text-white/70 uppercase">Estilo de vida</p>
            <p className="mt-2 max-w-xl text-2xl leading-[1.2] tracking-[-0.01em] text-white md:text-3xl">
              Frente al mar, en la costa de Yucatán.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Desarrollos que comercializo — carrusel real: Yucatán interior, costa, Playa del Carmen,
          Tulum. Las fichas van sin link hasta que existan las propias en /vivir-en-merida */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-[100px]">
        <Reveal>
          <p className="text-sm tracking-[0.2em] text-pebble uppercase">
            Desarrollos que comercializo
          </p>
        </Reveal>
        <Reveal>
          <h2 className="mt-4 max-w-2xl text-4xl leading-[1.1] tracking-[-0.02em] md:text-6xl">
            De la selva maya a la costa del Caribe.
          </h2>
        </Reveal>
        <Reveal>
          <div className="mt-16">
            <DevelopmentsCarousel items={DEVELOPMENTS} />
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
