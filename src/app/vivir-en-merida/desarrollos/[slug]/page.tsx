import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Check, MapPin, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/vivir/site-nav";
import { SiteFooter } from "@/components/vivir/footer";
import { Reveal } from "@/components/vivir/reveal";
import { ContactForm } from "@/components/vivir/contact-form";
import { WhatsAppButton } from "@/components/vivir/whatsapp-button";
import { JsonLd } from "@/components/vivir/json-ld";
import { breadcrumbJsonLd, realEstateListingJsonLd } from "@/lib/seo";
import { STATUS_LABEL } from "@/lib/site";
import { getDevelopmentContent } from "@/lib/development-content";
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
  // Sin nombre comercial: identidad pública = heading por ubicación.
  const nombre = dev.heading ?? place ?? "Desarrollo en Yucatán";
  const title = place && dev.heading ? `${dev.heading}, ${place}` : nombre;
  const description =
    dev.descriptionEs?.slice(0, 155) ??
    `${nombre}: amenidades, tipos de propiedad y disponibilidad.`;
  const ogImage = (await getDevelopmentImages(dev.id))[0];

  return {
    title,
    description,
    alternates: { canonical: `/vivir-en-merida/desarrollos/${slug}` },
    openGraph: {
      title,
      description,
      url: `/vivir-en-merida/desarrollos/${slug}`,
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

  const content = getDevelopmentContent(slug);
  // Los planos/masterplan del desarrollador llevan el nombre comercial impreso en el pixel:
  // se excluyen de la galería pública (el grep de HTML no los cacha, la marca va en la imagen).
  const publicImages = images.filter((i) => !/master-?plan|plano/i.test(i.url));
  const hero = publicImages[0];
  const gallery = publicImages.slice(1);
  const place = [dev.city, dev.state].filter(Boolean).join(", ");
  // Sin nombre comercial: identidad pública = heading por ubicación.
  const nombre = dev.heading ?? place ?? "Desarrollo en Yucatán";
  const waMessage = `Hola, quiero disponibilidad y precios de un desarrollo ${nombre.toLowerCase()}.`;
  const specs = (dev.highlightSpecs ?? []) as { label: string; value: string }[];
  const amenities = content?.amenities ?? dev.amenities ?? [];
  const estado = dev.statusMarketing ? STATUS_LABEL[dev.statusMarketing] ?? dev.statusMarketing : null;

  return (
    <>
      <JsonLd
        data={[
          realEstateListingJsonLd(dev, publicImages),
          breadcrumbJsonLd([
            { name: "Inicio", url: "/vivir-en-merida" },
            ...(zona
              ? [{ name: zona.nombre, url: `/vivir-en-merida/zonas/${zona.slug}` }]
              : []),
            { name: nombre, url: `/vivir-en-merida/desarrollos/${dev.slug}` },
          ]),
        ]}
      />
      <SiteNav overHero />
      <main className="bg-canvas text-ink">
        {/* 1 — Hero inmersivo full-bleed */}
        <section className="relative flex min-h-[88vh] w-full items-end overflow-hidden">
          {hero ? (
            <Image
              src={hero.url}
              alt={hero.alt ?? nombre}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-espresso" />
          )}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-espresso/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-espresso via-espresso/70 to-transparent" />

          <div className="relative z-10 w-full px-6 pb-16 md:px-10 md:pb-20">
            <div className="mx-auto max-w-[1440px]">
              <nav className="flex flex-wrap items-center gap-1.5 text-xs text-crema/70 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
                <Link href="/vivir-en-merida" className="hover:text-crema">Inicio</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                {zona && (
                  <>
                    <Link href={`/vivir-en-merida/zonas/${zona.slug}`} className="hover:text-crema">
                      {zona.nombre}
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
                <span className="text-crema">{nombre}</span>
              </nav>

              <div className="mt-6 max-w-3xl">
                {estado && (
                  <span className="inline-flex rounded-full border border-crema/40 px-4 py-1.5 text-sm text-crema [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
                    {estado}
                  </span>
                )}
                <h1 className="mt-4 font-display text-5xl font-light leading-[0.98] tracking-[-0.03em] text-crema [text-shadow:0_2px_20px_rgba(0,0,0,0.45)] md:text-7xl">
                  {nombre}
                </h1>
                {place && (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-crema/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
                    <MapPin className="h-4 w-4" />
                    {place}
                  </p>
                )}
                {content?.tagline && (
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-crema/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
                    {content.tagline}
                  </p>
                )}
                <div className="mt-7">
                  <WhatsAppButton message={waMessage} label="Solicita disponibilidad y precios" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2 — Specs reales (banda) */}
        {specs.length > 0 && (
          <section className="bg-espresso px-6 py-14 text-crema md:px-10">
            <div className="mx-auto grid max-w-[1440px] gap-8 sm:grid-cols-3">
              {specs.map((s) => (
                <Reveal key={s.label}>
                  <div className="border-t border-crema/20 pt-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-crema/60">{s.label}</p>
                    <p className="mt-2 font-display text-4xl font-light tracking-[-0.02em] md:text-5xl">
                      {s.value}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* 3 — Por qué es una opción ideal */}
        {content?.whyIdeal?.length ? (
          <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <Reveal>
                <div className="lg:sticky lg:top-28 lg:self-start">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-terracota">
                    <Sparkles className="h-4 w-4" /> Por qué aquí
                  </p>
                  <h2 className="mt-5 max-w-md font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-5xl">
                    Por qué es una opción ideal
                  </h2>
                  {dev.descriptionEs && (
                    <p className="mt-6 max-w-md leading-relaxed text-ink-2">{dev.descriptionEs}</p>
                  )}
                </div>
              </Reveal>
              <div>
                {content.whyIdeal.map((point, i) => (
                  <Reveal key={i}>
                    <div className="flex gap-5 border-b border-hairline py-6">
                      <span className="font-mono text-sm text-terracota">0{i + 1}</span>
                      <p className="text-xl font-light leading-[1.4] tracking-[-0.01em] md:text-2xl">
                        {point}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* 4 — Amenidades */}
        {amenities.length > 0 && (
          <section className="border-y border-hairline bg-surface-warm px-6 py-20 md:px-10 md:py-28">
            <div className="mx-auto max-w-[1440px]">
              <Reveal>
                <p className="text-xs uppercase tracking-[0.22em] text-terracota">Amenidades</p>
                <h2 className="mt-4 font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-5xl">
                  Lo que incluye
                </h2>
              </Reveal>
              <div className="mt-12 grid gap-x-12 gap-y-1 border-t border-hairline sm:grid-cols-2">
                {amenities.map((a) => (
                  <Reveal key={a}>
                    <div className="flex items-start gap-3 border-b border-hairline py-5">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-terracota" />
                      <span className="text-lg font-light leading-snug">{a}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5 — Galería (si hay más de una imagen) */}
        {gallery.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.22em] text-terracota">Galería</p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {gallery.map((img) => (
                <Reveal key={img.id}>
                  <div className="relative aspect-[16/11] overflow-hidden rounded-3xl">
                    <Image
                      src={img.url}
                      alt={img.alt ?? nombre}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* 6 — Zona y lugares cercanos */}
        {content?.nearby?.length ? (
          <section className="border-t border-hairline bg-canvas px-6 py-20 md:px-10 md:py-28">
            <div className="mx-auto max-w-[1440px]">
              <Reveal>
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-terracota">
                  <MapPin className="h-4 w-4" /> El entorno
                </p>
                <h2 className="mt-4 max-w-xl font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-5xl">
                  Qué hay cerca
                </h2>
              </Reveal>
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {content.nearby.map((n) => (
                  <Reveal key={n.label}>
                    <div className="h-full rounded-3xl border border-hairline bg-surface p-7">
                      <p className="font-display text-2xl font-light tracking-[-0.01em]">{n.label}</p>
                      <p className="mt-2 leading-relaxed text-ink-2">{n.hint}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
              {zona && (
                <Reveal>
                  <Link
                    href={`/vivir-en-merida/zonas/${zona.slug}`}
                    className="mt-8 inline-flex items-center gap-2 text-sm text-terracota"
                  >
                    Ver el perfil de la zona <ChevronRight className="h-4 w-4" />
                  </Link>
                </Reveal>
              )}
            </div>
          </section>
        ) : null}

        {/* 7 — Contacto (panel + formulario) */}
        <section id="solicitar" className="border-t border-hairline bg-surface-warm scroll-mt-24">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-24 md:grid-cols-2 md:gap-20 md:px-10 md:py-32">
            <div>
              <Reveal>
                <p className="text-xs uppercase tracking-[0.22em] text-terracota">Disponibilidad</p>
                <h2 className="mt-4 font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-5xl">
                  Precios y unidades bajo solicitud
                </h2>
              </Reveal>
              <Reveal>
                <p className="mt-6 max-w-md leading-relaxed text-ink-2">
                  Te compartimos el inventario vigente, precios y planes de pago directo del
                  desarrollador. Deja tus datos o escríbenos por WhatsApp.
                </p>
              </Reveal>
              <Reveal>
                <dl className="mt-8 max-w-md space-y-3 border-t border-hairline pt-6 text-sm">
                  {estado && (
                    <div className="flex items-center justify-between">
                      <dt className="text-ink-2">Etapa</dt>
                      <dd className="font-mono">{estado}</dd>
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
                        <Link href={`/vivir-en-merida/zonas/${zona.slug}`} className="text-terracota">
                          {zona.nombre}
                        </Link>
                      </dd>
                    </div>
                  )}
                </dl>
              </Reveal>
              <Reveal>
                <div className="mt-8 max-w-md">
                  <WhatsAppButton message={waMessage} label="Solicita disponibilidad y precios" />
                </div>
              </Reveal>
              <Reveal>
                <Link
                  href={zona ? `/vivir-en-merida/zonas/${zona.slug}` : "/vivir-en-merida"}
                  className="mt-8 inline-flex items-center gap-2 text-sm text-terracota"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {zona ? `Volver a ${zona.nombre}` : "Volver al inicio"}
                </Link>
              </Reveal>
            </div>
            <Reveal>
              <ContactForm developmentSlug={dev.slug} zonaSlug={zona?.slug} contextLabel={nombre} />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
