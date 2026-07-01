import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { Reveal } from "@/components/reveal";

const VALUE_PROPS = [
  {
    title: "Seguridad",
    body: "Yucatán se mantiene como el estado más seguro de México, según múltiples índices nacionales, gracias a sus bajos niveles de delincuencia.",
  },
  {
    title: "Certeza legal",
    body: "Cada desarrollo cuenta con documentación en regla: permisos municipales y estatales, y la propiedad legal de los terrenos.",
  },
  {
    title: "Riqueza hídrica",
    body: "Yucatán tiene una de las reservas de agua subterránea más importantes de México, gracias a su red de cenotes y acuíferos naturales.",
  },
];

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
      {/* Hero — full-bleed, split headline sobre foto real (club de playa, Ciudad Central Progreso) */}
      <section className="relative flex h-[100dvh] min-h-[640px] w-full items-end overflow-hidden">
        <SiteNav />
        <Image
          src="/hero/orve-club-playa-progreso.webp"
          alt="Villa y club de playa frente al mar — desarrollo Ciudad Central Progreso de Grupo Orve"
          fill
          priority
          className="object-cover"
        />
        {/* Foto real de cielo claro: sin tinte el nav y el headline no se leen (regla Lightship
            de DESIGN.md — se prueba sin overlay primero, se agrega solo si no hay legibilidad) */}
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

      {/* Por qué invertir — value props reales + stat */}
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

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-[20px] bg-mist md:grid-cols-3">
          {VALUE_PROPS.map((v) => (
            <Reveal key={v.title}>
              <div className="h-full bg-cream p-8">
                <h3 className="text-xl">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-pebble">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Banda cinematográfica — Mérida real, mismo claim de seguridad ya aprobado, ahora con prueba visual */}
      <Reveal>
        <section className="relative h-[60vh] min-h-[380px] w-full overflow-hidden">
          <Image
            src="/hero/orve-merida-centro.webp"
            alt="Centro histórico de Mérida, Yucatán"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:px-10 md:pb-14">
            <p className="text-sm tracking-[0.2em] text-white/70 uppercase">Mérida, Yucatán</p>
            <p className="mt-2 max-w-xl text-2xl leading-[1.2] tracking-[-0.01em] text-white md:text-3xl">
              Yucatán se mantiene como el estado más seguro de México.
            </p>
          </div>
        </section>
      </Reveal>

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

      {/* Banda cinematográfica — cenote real, mismo claim de riqueza hídrica ya aprobado */}
      <Reveal>
        <section className="relative h-[60vh] min-h-[380px] w-full overflow-hidden">
          <Image
            src="/hero/orve-cenote.webp"
            alt="Cenote en la selva de Yucatán"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 top-0 px-6 pt-10 text-right md:px-10 md:pt-14">
            <p className="text-sm tracking-[0.2em] text-white/70 uppercase">Cenotes de Yucatán</p>
            <p className="mt-2 ml-auto max-w-xl text-2xl leading-[1.2] tracking-[-0.01em] text-white md:text-3xl">
              Una de las reservas de agua subterránea más importantes de México.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Xo'ok — desarrollo piloto, tipografía display + imagen real */}
      <section id="xook" className="relative overflow-hidden py-24 md:py-[100px]">
        <Reveal>
          <h2 className="px-6 text-[15vw] leading-[0.9] tracking-[-0.04em] md:px-10 md:text-[8vw]">
            Xo&apos;ok
          </h2>
        </Reveal>

        <Reveal>
          <div className="relative mx-6 -mt-[6vw] aspect-[16/10] overflow-hidden rounded-[20px] md:mx-10 md:-mt-[3vw]">
            <Image
              src="/hero/xook-spa-xenotikal.webp"
              alt="Casa club Xenotikal en Xo'ok, Yucatán"
              fill
              className="object-cover"
            />
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 pt-12 md:grid-cols-2 md:px-10">
          <Reveal>
            <div>
              <h3 className="text-2xl tracking-[-0.01em] md:text-3xl">
                Vive en equilibrio con el lujo y la naturaleza
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-pebble">
                Un desarrollo único con 7 exclusivas etapas residenciales, donde cada detalle está
                diseñado para brindarte confort y calidad de vida. Xenotikal, su casa club, nace de
                los mitos del cenote: un santuario moderno construido sobre la idea de que la
                sanación no es solo física, sino también espiritual.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-8 self-start rounded-[20px] border border-mist p-8 text-sm">
              <div>
                <dt className="text-pebble">Aparta con</dt>
                <dd className="mt-1 text-2xl">$10,000 MXN</dd>
              </div>
              <div>
                <dt className="text-pebble">Enganche</dt>
                <dd className="mt-1 text-2xl">25%</dd>
              </div>
              <div>
                <dt className="text-pebble">Etapas</dt>
                <dd className="mt-1 text-2xl">7</dd>
              </div>
              <div>
                <dt className="text-pebble">Parque central</dt>
                <dd className="mt-1 text-2xl">413 m</dd>
              </div>
              <p className="col-span-2 mt-2 text-xs text-driftwood">
                *Aplican restricciones. Cifras de marketing publicadas por Grupo Orve — no son
                inventario verificado.
              </p>
            </dl>
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

      {/* Cierre */}
      <section className="relative overflow-hidden bg-cream py-24 text-center md:py-[100px]">
        <Reveal>
          <p className="mx-auto max-w-2xl px-6 text-3xl leading-[1.2] tracking-[-0.01em] md:text-5xl">
            Cada vez más personas construyen su futuro con Grupo Orve.
          </p>
        </Reveal>
        <Reveal>
          <a
            href="https://www.grupoorve.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full border border-obsidian px-6 py-2.5 text-sm transition hover:bg-obsidian hover:text-white"
          >
            Conoce Grupo Orve
          </a>
        </Reveal>
      </section>
    </main>
  );
}
