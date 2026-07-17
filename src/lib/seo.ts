import { BRAND } from "@/lib/site";
import type { Development, DevelopmentImage, Zona } from "@/lib/schema";

// Builders de JSON-LD tipados. Se serializan en <script type="application/ld+json">.
// Regla anti-slop: nunca inventamos precio/plusvalía/ubicación exacta; si el dato no
// está verificado, no entra al structured data.

type BreadcrumbItem = { name: string; url: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${BRAND.url}${it.url}`,
    })),
  };
}

export function placeJsonLd(zona: Zona) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: zona.nombre,
    description: zona.descripcionEs ?? undefined,
    url: `${BRAND.url}/vivir-en-merida/zonas/${zona.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mérida",
      addressRegion: "Yucatán",
      addressCountry: "MX",
    },
  };
}

export function realEstateListingJsonLd(
  dev: Development,
  images: DevelopmentImage[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: dev.name,
    description: dev.descriptionEs ?? undefined,
    url: `${BRAND.url}/vivir-en-merida/desarrollos/${dev.slug}`,
    image: images.map((img) => `${BRAND.url}${img.url}`),
    address: {
      "@type": "PostalAddress",
      addressLocality: dev.city ?? "Mérida",
      addressRegion: dev.state ?? "Yucatán",
      addressCountry: dev.country ?? "MX",
    },
    // Sin `offers`: precio verified:false, no se declara.
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: BRAND.url,
    areaServed: { "@type": "AdministrativeArea", name: "Yucatán, México" },
  };
}
