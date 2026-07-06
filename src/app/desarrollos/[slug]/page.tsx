import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Check, MapPin } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { ContactForm } from "@/components/contact-form";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, realEstateListingJsonLd } from "@/lib/seo";
import { STATUS_LABEL } from "@/lib/site";
import {
  getAllDevelopmentSlugs,
  getDevelopmentBySlug,
  getDevelopmentImages,
  getZonaById,
} from "@/lib/queries";

export async function generateStaticParams() {
  const slugs = await getAllDevelopmentSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dev = await getDevelopmentBySlug(slug);
  if (!dev) return { title: "Desarrollo" };

  const place = [dev.city, dev.state].filter(Boolean).join(", ");
  const title = `${dev.name}${place ? ` en ${place}` : ""}`;
  const description =
    dev.descriptionEs?.slice(0, 155) ??
    `${dev.name}: amenidades, tipos de propiedad y disponibilidad.`;
  const ogImage = (await getDevelopmentImages(dev.id))[0];

  return {
    title,
    description,
    alternates: { canonical: `/desarrollos/${slug}` },
    openGraph: {
      title,
      description,
      url: `/desarrollos/${slug}`,
      images: ogImage ? [ogImage.url] : [],
    },
  };
}

export default async function DesarrolloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dev = await getDevelopmentBySlug(slug);
  if (!dev) notFound();

  const [images, zona] = await Promise.all([
    getDevelopmentImages(dev.id),
    dev.zonaId ? getZonaById(dev.zonaId) : Promise.resolve(undefined),
  ]);

  const hero = images[0];
  const rest = images.slice(1);
  const place = [dev.city, dev.state].filter(Boolean).join(", ");
  const waMessage = `Hola, quiero disponibilidad y precios de ${dev.name}.`;

  return (
    <>
      <JsonLd
        data={[
          realEstateListingJsonLd(dev, images),
          breadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            ...(zona ? [{ name: zona.nombre, url: `/zonas/${zona.slug}` }] : []),
            { name: dev.name, url: `/desarrollos/${dev.slug}` },
          ]),
        ]}
      />
      <SiteNav overHero={false} />
      <main className="bg-canvas text-ink">
        {/* Breadcrumb + encabezado */}
        <section className="mx-auto max-w-[1440px] px-6 pt-28 md:px-10">
          <Reveal>
            <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
              <Link href="/" className="hover:text-terracota">
                Inicio
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              {zona && (
                <>
                  <Link href={`/zonas/${zona.slug}`} className="hover:text-terracota">
                    {zona.nombre}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
              <span className="text-ink">{dev.name}</span>
            </nav>
          </Reveal>
          <Reveal>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.03em] md:text-7xl">
                  {dev.name}
                </h1>
                {place && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-ink-2">
                    <MapPin className="h-4 w-4 text-terracota" />
                    {place}
                  </p>
                )}
              </div>
              {dev.statusMarketing && (
                <span className="rounded-full border border-terracota/40 px-4 py-1.5 text-sm text-terracota">
                  {STATUS_LABEL[dev.statusMarketing] ?? dev.statusMarketing}
                </span>
              )}
            </div>
          </Reveal>
        </section>

        {/* Dos columnas: galería + panel sticky */}
        <section className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Galería */}
            <div className="space-y-4">
              {hero && (
                <Reveal>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
                    <Image
                      src={hero.url}
                      alt={hero.alt ?? dev.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              )}
              {rest.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rest.map((img) => (
                    <Reveal key={img.id}>
                      <div className="relative aspect-[16/11] overflow-hidden rounded-2xl">
                        <Image
                          src={img.url}
                          alt={img.alt ?? dev.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}

              {/* Descripción */}
              <Reveal>
                <div className="pt-8">
                  <p className="text-xs uppercase tracking-[0.22em] text-terracota">
                    Sobre el desarrollo
                  </p>
                  <p className="mt-5 max-w-2xl text-xl font-light leading-[1.5] tracking-[-0.01em] md:text-2xl">
                    {dev.descriptionEs}
                  </p>
                </div>
              </Reveal>

              {/* Tipos de propiedad */}
              {dev.propertyTypes && dev.propertyTypes.length > 0 && (
                <Reveal>
                  <div className="pt-8">
                    <p className="text-xs uppercase tracking-[0.16em] text-ink-2">
                      Tipos de propiedad
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {dev.propertyTypes.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-hairline bg-surface px-4 py-1.5 text-sm capitalize"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Amenidades, lista con hairlines */}
              {dev.amenities && dev.amenities.length > 0 && (
                <Reveal>
                  <div className="pt-10">
                    <p className="text-xs uppercase tracking-[0.16em] text-ink-2">Amenidades</p>
                    <ul className="mt-4 grid gap-x-10 border-t border-hairline sm:grid-cols-2">
                      {dev.amenities.map((a) => (
                        <li
                          key={a}
                          className="flex items-center gap-3 border-b border-hairline py-3.5 text-[0.95rem]"
                        >
                          <Check className="h-4 w-4 shrink-0 text-terracota" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Panel sticky: sin precios (verified:false) */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-hairline bg-surface p-7">
                <p className="text-xs uppercase tracking-[0.16em] text-ink-2">Disponibilidad</p>
                <p className="mt-3 font-display text-2xl leading-tight tracking-[-0.01em]">
                  Precios y unidades bajo solicitud
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">
                  Este desarrollo se comercializa en preventa. Te compartimos el inventario vigente,
                  precios y planes de pago directo del desarrollador.
                </p>

                <div className="mt-6 space-y-3">
                  <WhatsAppButton message={waMessage} label="Solicita disponibilidad y precios" />
                  <a
                    href="#solicitar"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm transition hover:border-terracota hover:text-terracota"
                  >
                    Enviar mis datos
                  </a>
                </div>

                <dl className="mt-7 space-y-3 border-t border-hairline pt-6 text-sm">
                  {dev.statusMarketing && (
                    <div className="flex items-center justify-between">
                      <dt className="text-ink-2">Etapa</dt>
                      <dd className="font-mono">
                        {STATUS_LABEL[dev.statusMarketing] ?? dev.statusMarketing}
                      </dd>
                    </div>
                  )}
                  {place && (
                    <div className="flex items-center justify-between">
                      <dt className="text-ink-2">Ubicación</dt>
                      <dd className="font-mono">{place}</dd>
                    </div>
                  )}
                  {zona && (
                    <div className="flex items-center justify-between">
                      <dt className="text-ink-2">Zona</dt>
                      <dd>
                        <Link href={`/zonas/${zona.slug}`} className="text-terracota">
                          {zona.nombre}
                        </Link>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </aside>
          </div>
        </section>

        {/* Formulario */}
        <section id="solicitar" className="border-t border-hairline bg-surface-warm scroll-mt-24">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-24 md:grid-cols-2 md:gap-20 md:px-10 md:py-32">
            <div>
              <Reveal>
                <h2 className="font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-5xl">
                  Solicita disponibilidad y precios
                </h2>
              </Reveal>
              <Reveal>
                <p className="mt-6 max-w-md leading-relaxed text-ink-2">
                  Déjanos tus datos y te enviamos el inventario vigente de {dev.name}, directo del
                  desarrollador.
                </p>
              </Reveal>
              <Reveal>
                <Link
                  href={zona ? `/zonas/${zona.slug}` : "/"}
                  className="mt-8 inline-flex items-center gap-2 text-sm text-terracota"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {zona ? `Volver a ${zona.nombre}` : "Volver al inicio"}
                </Link>
              </Reveal>
            </div>
            <Reveal>
              <ContactForm
                developmentSlug={dev.slug}
                zonaSlug={zona?.slug}
                contextLabel={dev.name}
              />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
