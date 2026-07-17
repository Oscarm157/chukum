import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/vivir/site-nav";
import { SiteFooter } from "@/components/vivir/footer";
import { Reveal } from "@/components/vivir/reveal";
import { ParallaxImage } from "@/components/vivir/parallax-image";
import { ContactForm } from "@/components/vivir/contact-form";
import { WhatsAppButton } from "@/components/vivir/whatsapp-button";
import { JsonLd } from "@/components/vivir/json-ld";
import { breadcrumbJsonLd, placeJsonLd } from "@/lib/seo";
import {
  getZonasPublicadas,
  getZonaBySlug,
  getDevelopmentsByZona,
  getDevelopmentImages,
} from "@/lib/queries";
import type { Development, DevelopmentImage } from "@/lib/schema";

export async function generateStaticParams() {
  const zonas = await getZonasPublicadas();
  return zonas.map((z) => ({ slug: z.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const zona = await getZonaBySlug(slug);
  if (!zona) return { title: "Zona" };

  const title = `Casas y terrenos en venta en ${zona.nombre}`;
  const description =
    zona.descripcionEs?.slice(0, 155) ??
    `Guía de ${zona.nombre}: perfil de la zona y desarrollos disponibles.`;
  const zonaDevs = await getDevelopmentsByZona(zona.id);
  const ogImage = zonaDevs[0]
    ? (await getDevelopmentImages(zonaDevs[0].id))[0]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/vivir-en-merida/zonas/${slug}` },
    openGraph: {
      title,
      description,
      url: `/vivir-en-merida/zonas/${slug}`,
      images: ogImage ? [ogImage.url] : [],
    },
  };
}

export default async function ZonaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const zona = await getZonaBySlug(slug);
  if (!zona) notFound();

  const devs = await getDevelopmentsByZona(zona.id);
  const devImages: Record<string, DevelopmentImage | undefined> = {};
  await Promise.all(
    devs.map(async (d) => {
      devImages[d.id] = (await getDevelopmentImages(d.id))[0];
    }),
  );
  const heroImg = devs[0] ? devImages[devs[0].id] : undefined;

  return (
    <>
      <JsonLd
        data={[
          placeJsonLd(zona),
          breadcrumbJsonLd([
            { name: "Inicio", url: "/vivir-en-merida" },
            { name: zona.nombre, url: `/vivir-en-merida/zonas/${zona.slug}` },
          ]),
        ]}
      />
      <SiteNav />
      <main className="bg-canvas text-ink">
        {/* Hero de zona */}
        <section className="relative flex h-[62vh] min-h-[420px] w-full items-end overflow-hidden">
          <ParallaxImage
            src={heroImg?.url ?? "/hero/merida-plaza-grande.webp"}
            alt={heroImg?.alt ?? `Zona ${zona.nombre}, Yucatán`}
            priority
            className="absolute inset-0 h-full w-full"
            amount={60}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-espresso/45" />
          <div className="relative z-10 w-full px-6 pb-12 md:px-10 md:pb-16">
            <Reveal>
              <nav className="flex items-center gap-1.5 text-xs text-crema/75">
                <Link href="/vivir-en-merida" className="hover:text-crema">
                  Inicio
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-crema">Zonas</span>
              </nav>
            </Reveal>
            <Reveal>
              <h1 className="mt-4 font-display text-5xl font-light leading-[0.95] tracking-[-0.03em] text-crema md:text-7xl">
                {zona.nombre}
              </h1>
            </Reveal>
          </div>
        </section>

        {/* Narrativa editorial */}
        <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:gap-20">
            <Reveal>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-terracota">La zona</p>
                <p className="mt-6 font-display text-2xl font-light leading-[1.35] tracking-[-0.01em] md:text-[2rem]">
                  {zona.descripcionEs}
                </p>
              </div>
            </Reveal>
            {zona.perfilComprador && (
              <Reveal>
                <div className="rounded-3xl border border-hairline bg-surface-warm p-8">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-2">
                    Perfil del comprador
                  </p>
                  <p className="mt-4 leading-relaxed text-ink">{zona.perfilComprador}</p>
                </div>
              </Reveal>
            )}
          </div>
        </section>

        {/* Desarrollos en la zona */}
        <section className="border-t border-hairline bg-surface-warm">
          <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
            <Reveal>
              <h2 className="font-display text-3xl font-light leading-[1.05] tracking-[-0.02em] md:text-5xl">
                Desarrollos en {zona.nombre}
              </h2>
            </Reveal>

            {devs.length === 0 ? (
              <p className="mt-8 text-ink-2">
                Aún no hay desarrollos publicados en esta zona.
              </p>
            ) : (
              <div className="mt-12 grid gap-6 md:grid-cols-2">
                {devs.map((d, i) => (
                  <Reveal key={d.id}>
                    <DevCard dev={d} image={devImages[d.id]} index={i} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <Reveal>
                <h2 className="font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-5xl">
                  ¿Buscas en {zona.nombre}?
                </h2>
              </Reveal>
              <Reveal>
                <p className="mt-6 max-w-md leading-relaxed text-ink-2">
                  Te pasamos disponibilidad y precios de los desarrollos de la zona, directo del
                  desarrollador.
                </p>
              </Reveal>
              <Reveal>
                <div className="mt-8">
                  <WhatsAppButton
                    message={`Hola, quiero información de desarrollos en ${zona.nombre}.`}
                    label="Prefiero WhatsApp"
                    variant="outline"
                  />
                </div>
              </Reveal>
            </div>
            <Reveal>
              <ContactForm zonaSlug={zona.slug} contextLabel={zona.nombre} />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function DevCard({
  dev,
  image,
  index,
}: {
  dev: Development;
  image: DevelopmentImage | undefined;
  index: number;
}) {
  return (
    <Link
      href={`/vivir-en-merida/desarrollos/${dev.slug}`}
      className="group block overflow-hidden rounded-3xl border border-hairline bg-surface"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={image?.url ?? "/desarrollos/ciudad-central-merida/masterplan.jpg"}
          alt={image?.alt ?? dev.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {dev.statusMarketing && (
          <span className="absolute left-4 top-4 rounded-full bg-canvas/90 px-3 py-1 text-xs capitalize text-ink backdrop-blur">
            {dev.statusMarketing.replace("_", " ")}
          </span>
        )}
      </div>
      <div className="p-7">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-2">
          Desarrollo 0{index + 1}
        </p>
        <h3 className="mt-2 font-display text-2xl tracking-[-0.01em]">{dev.name}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {dev.propertyTypes?.map((t) => (
            <span
              key={t}
              className="rounded-full border border-hairline px-2.5 py-0.5 text-xs capitalize text-ink-2"
            >
              {t}
            </span>
          ))}
        </div>
        <span className="mt-5 inline-flex items-center gap-2 text-sm text-terracota">
          Ver desarrollo
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
