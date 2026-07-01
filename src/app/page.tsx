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
    body: "Cada desarrollo cuenta con documentación en regla: permisos municipales y estatales, y la propiedad legal de los terrenos.",
    image: "/hero/orve-card-certeza-legal.webp",
    alt: "Equipo de Grupo Orve revisando la documentación de un desarrollo",
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
      "*Aplican restricciones. Cifras de marketing publicadas por Grupo Orve, no son inventario verificado.",
  },
];

const DEVELOPMENTS = [
  {
    name: "Xo'ok",
    place: "Yucatán · selva maya",
    image: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club Xenotikal, desarrollo Xo'ok",
    href: "https://www.grupoorve.com/xook/",
  },
  {
    name: "Ciudad Central Mérida",
    place: "Mérida, Yucatán",
    image: "/hero/orve-ccm-casa-club.webp",
    alt: "Casa club y alberca, Ciudad Central Mérida",
    href: "https://www.grupoorve.com/ciudad-central-merida/",
  },
  {
    name: "Ciudad Central Progreso",
    place: "Progreso, Yucatán · frente al mar",
    image: "/hero/orve-ccp-pabellon.webp",
    alt: "Acceso del desarrollo Ciudad Central Progreso",
    href: "https://www.grupoorve.com/ciudad-central-progreso/",
  },
  {
    name: "Ukana Playa del Carmen",
    place: "Playa del Carmen, Quintana Roo",
    image: "/hero/orve-ukana-pdc-alberca.webp",
    alt: "Alberca entregada, Ukana Playa del Carmen",
    href: "https://www.grupoorve.com/ukana-playa-del-carmen/",
  },
  {
    name: "Tulum Ha",
    place: "Tulum, Quintana Roo · en construcción",
    image: "/hero/orve-tulum-ha-avance.webp",
    alt: "Avance de obra real, Tulum Ha",
    href: "https://www.grupoorve.com/tulum-ha/",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Estoy muy contento con mi inversión en terreno, una decisión que me da seguridad y confianza para este que será el patrimonio de mi hijo. Gracias por el excelente acompañamiento en todo el proceso.",
    name: "Esteban Escalante",
  },
  {
    quote:
      "Mi experiencia con Grupo Orve ha sido excelente. Desde el inicio, el proceso fue fácil de entender y muy transparente. Lo que más me gustó fue la certeza legal que me dieron y la claridad con la que me explicaron cada detalle.",
    name: "Elizabeth García",
  },
  {
    quote:
      "En 2019 me animé a dar el paso y invertir con Orve. Me dejé guiar por su equipo de expertos y todo fue súper claro y respetuoso. Hoy me siento feliz porque esa decisión me ha dado una gran plusvalía.",
    name: "Laura Moreno",
  },
];

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
        heroAlt="Villa y club de playa frente al mar — desarrollo Ciudad Central Progreso de Grupo Orve"
      />

      {/* Historia — párrafo editorial grande, copy verbatim de quienes-somos */}
      <section className="border-t border-mist bg-white py-24 md:py-[100px]">
        <Reveal>
          <p className="mx-auto max-w-4xl px-6 text-3xl leading-[1.25] tracking-[-0.01em] md:px-10 md:text-5xl">
            Motivados por la idea de que cada vez más personas pueden construir un futuro estable,
            comenzamos con el desarrollo de proyectos que les ofrecieran la oportunidad de
            convertirse en inversionistas con opciones que se ajustaran a cada bolsillo.
          </p>
        </Reveal>
      </section>

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
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-2xl text-4xl leading-[1.1] tracking-[-0.02em] md:text-6xl">
              Construimos tu patrimonio con proyectos inmobiliarios de alto valor y confianza
              comprobada.
            </h2>
            <p className="whitespace-nowrap text-5xl tracking-[-0.02em] md:text-6xl">
              +1000
              <span className="block text-base font-normal tracking-normal text-pebble">
                inversionistas
              </span>
            </p>
          </div>
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
              Frente al mar, en los desarrollos de Grupo Orve en la costa de Yucatán.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Nuestros desarrollos — carrusel real: Yucatán interior, costa, Playa del Carmen, Tulum */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-[100px]">
        <Reveal>
          <p className="text-sm tracking-[0.2em] text-pebble uppercase">Nuestros desarrollos</p>
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

      {/* Sobre Grupo Orve — copy verbatim de quienes-somos + foto real del equipo */}
      <section className="border-t border-mist bg-white py-24 md:py-[100px]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 md:grid-cols-2 md:px-10 md:items-center">
          <Reveal>
            <div>
              <p className="text-sm tracking-[0.2em] text-pebble uppercase">Sobre Grupo Orve</p>
              <p className="mt-4 text-2xl leading-[1.3] tracking-[-0.01em] md:text-3xl">
                En Grupo ORVE nos motiva ayudar a que cada vez más personas puedan construir un
                futuro estable. Logramos resultados extraordinarios en cortos periodos de tiempo.
              </p>
              <a
                href="https://www.grupoorve.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-full border border-obsidian px-6 py-2.5 text-sm transition hover:bg-obsidian hover:text-white"
              >
                Conócenos
              </a>
            </div>
          </Reveal>
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
              <Image
                src="/hero/orve-equipo.webp"
                alt="Equipo de Grupo Orve"
                fill
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonios reales */}
      <section className="border-t border-mist bg-white py-24 md:py-[100px]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.2em] text-pebble">
              ¿Qué opinan nuestros inversionistas?
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Reveal key={t.name}>
                <blockquote className="flex h-full flex-col justify-between gap-6">
                  <p className="text-lg leading-relaxed tracking-[-0.01em]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="text-sm text-pebble">— {t.name}</footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre — solo visual, sin formulario (tier landing sin CRM) */}
      <section className="relative overflow-hidden bg-cream py-24 text-center md:py-[100px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle,var(--color-mist)_1px,transparent_1px)] [background-size:28px_28px]"
        />
        <Reveal>
          <p className="relative mx-auto max-w-2xl px-6 text-3xl leading-[1.2] tracking-[-0.01em] md:text-5xl">
            Cada vez más personas construyen su futuro con Grupo Orve.
          </p>
        </Reveal>
        <Reveal>
          <a
            href="https://www.grupoorve.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative mt-8 inline-flex rounded-full border border-obsidian px-6 py-2.5 text-sm transition hover:bg-obsidian hover:text-white"
          >
            Conoce Grupo Orve
          </a>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
