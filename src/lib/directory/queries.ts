import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { zonas } from "../schema";
import { guides, places, type PerfilSlug } from "../schema-directory";
import type { DirectoryFilters } from "./filters";

// Acceso a datos del directorio y las guías. Todo pasa por Drizzle contra la tabla `places`/`guides`.
// El orden del directorio: primero los fijados (featured), luego por ranking; los sin ranking al final.

function perfilContains(perfil: PerfilSlug) {
  // jsonb @> [perfil]: la fila tiene ese perfil en su array `perfiles`.
  return sql`${places.perfiles} @> ${JSON.stringify([perfil])}::jsonb`;
}

/** Listado del directorio con filtros por categoría, zona (slug) y perfil. Publicados y no vetados. */
export async function getPlacesFiltered(filters: DirectoryFilters) {
  const conds = [eq(places.published, true), eq(places.hidden, false)];

  if (filters.categoria) conds.push(eq(places.category, filters.categoria));
  if (filters.perfil) conds.push(perfilContains(filters.perfil));
  if (filters.zona) {
    const zona = await db
      .select({ id: zonas.id })
      .from(zonas)
      .where(eq(zonas.slug, filters.zona))
      .limit(1);
    // zona inexistente -> listado vacío (condición imposible), no ignorar el filtro.
    conds.push(eq(places.zonaId, zona[0]?.id ?? "00000000-0000-0000-0000-000000000000"));
  }

  return db
    .select()
    .from(places)
    .where(and(...conds))
    .orderBy(desc(places.featured), sql`${places.rankInCategory} asc nulls last`);
}

/** Ficha de un lugar por slug (publicado). */
export async function getPlaceBySlug(slug: string) {
  const rows = await db
    .select()
    .from(places)
    .where(and(eq(places.slug, slug), eq(places.published, true)))
    .limit(1);
  return rows[0] ?? null;
}

/** Top de lugares de una zona, para el cruce zona -> directorio en la página de zona. */
export async function getPlacesForZona(zonaId: string, limit = 6) {
  return db
    .select()
    .from(places)
    .where(and(eq(places.zonaId, zonaId), eq(places.published, true), eq(places.hidden, false)))
    .orderBy(desc(places.featured), sql`${places.rankInCategory} asc nulls last`)
    .limit(limit);
}

/** Guías publicadas, opcionalmente filtradas por perfil. */
export async function getPublishedGuides(perfil?: PerfilSlug) {
  const conds = [eq(guides.published, true)];
  if (perfil) conds.push(sql`${guides.perfiles} @> ${JSON.stringify([perfil])}::jsonb`);
  return db
    .select()
    .from(guides)
    .where(and(...conds))
    .orderBy(desc(guides.publishedAt));
}

/** Guía publicada por slug. */
export async function getGuideBySlug(slug: string) {
  const rows = await db
    .select()
    .from(guides)
    .where(and(eq(guides.slug, slug), eq(guides.published, true)))
    .limit(1);
  return rows[0] ?? null;
}
