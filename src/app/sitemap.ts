import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getZonasPublicadas, getAllDevelopmentSlugs } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];

  const zonas = await getZonasPublicadas();
  const zonaRoutes: MetadataRoute.Sitemap = zonas.map((z) => ({
    url: `${SITE.url}/zonas/${z.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const devSlugs = await getAllDevelopmentSlugs();
  const devRoutes: MetadataRoute.Sitemap = devSlugs.map((slug) => ({
    url: `${SITE.url}/desarrollos/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...zonaRoutes, ...devRoutes];
}
