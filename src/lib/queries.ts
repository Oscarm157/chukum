import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  developments,
  developmentImages,
  zonas,
  type Development,
  type DevelopmentImage,
  type Zona,
} from "@/lib/schema";

// Capa de datos del sitio público. Todo se lee de Neon en build (SSG) vía
// generateStaticParams / render de servidor. Gate anti thin-content: solo
// zonas `publicada = true` salen al aire.

export async function getZonasPublicadas(): Promise<Zona[]> {
  return db
    .select()
    .from(zonas)
    .where(eq(zonas.publicada, true))
    .orderBy(asc(zonas.nombre));
}

export async function getZonaBySlug(slug: string): Promise<Zona | undefined> {
  const rows = await db
    .select()
    .from(zonas)
    .where(and(eq(zonas.slug, slug), eq(zonas.publicada, true)))
    .limit(1);
  return rows[0];
}

export async function getZonaById(id: string): Promise<Zona | undefined> {
  const rows = await db
    .select()
    .from(zonas)
    .where(and(eq(zonas.id, id), eq(zonas.publicada, true)))
    .limit(1);
  return rows[0];
}

export async function getAllDevelopmentSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: developments.slug }).from(developments);
  return rows.map((r) => r.slug);
}

export async function getDevelopmentsByZona(zonaId: string): Promise<Development[]> {
  return db
    .select()
    .from(developments)
    .where(eq(developments.zonaId, zonaId))
    .orderBy(asc(developments.name));
}

export async function getDevelopmentBySlug(slug: string): Promise<Development | undefined> {
  const rows = await db
    .select()
    .from(developments)
    .where(eq(developments.slug, slug))
    .limit(1);
  return rows[0];
}

export async function getDevelopmentImages(devId: string): Promise<DevelopmentImage[]> {
  return db
    .select()
    .from(developmentImages)
    .where(eq(developmentImages.developmentId, devId))
    .orderBy(asc(developmentImages.sortOrder));
}
