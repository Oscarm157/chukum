import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  developments,
  developmentImages,
  units,
  zonas,
  type Development,
  type DevelopmentImage,
} from "./schema";

export type Unit = typeof units.$inferSelect;
export type DesarrolloRow = Development & { unitCount: number; imageCount: number };

// Lista para la tabla del panel: cada desarrollo con conteo de modelos e imágenes.
export async function getDesarrollos(): Promise<DesarrolloRow[]> {
  const rows = await db.select().from(developments).orderBy(desc(developments.createdAt));

  const unitRows = await db
    .select({ id: units.developmentId, n: sql<number>`count(*)::int` })
    .from(units)
    .groupBy(units.developmentId);
  const imgRows = await db
    .select({ id: developmentImages.developmentId, n: sql<number>`count(*)::int` })
    .from(developmentImages)
    .groupBy(developmentImages.developmentId);

  const unitMap = new Map(unitRows.map((r) => [r.id, r.n]));
  const imgMap = new Map(imgRows.map((r) => [r.id, r.n]));

  return rows.map((d) => ({
    ...d,
    unitCount: unitMap.get(d.id) ?? 0,
    imageCount: imgMap.get(d.id) ?? 0,
  }));
}

export async function getDesarrolloById(id: string): Promise<Development | null> {
  const r = await db.select().from(developments).where(eq(developments.id, id));
  return r[0] ?? null;
}

export async function getUnitsForDesarrollo(devId: string): Promise<Unit[]> {
  return db.select().from(units).where(eq(units.developmentId, devId)).orderBy(asc(units.createdAt));
}

export async function getImagesForDesarrollo(devId: string): Promise<DevelopmentImage[]> {
  return db
    .select()
    .from(developmentImages)
    .where(eq(developmentImages.developmentId, devId))
    .orderBy(asc(developmentImages.sortOrder), asc(developmentImages.createdAt));
}

// Opciones de zona SEO para el select del formulario (enlace opcional).
export async function getZonaOptions(): Promise<{ id: string; nombre: string }[]> {
  return db
    .select({ id: zonas.id, nombre: zonas.nombre })
    .from(zonas)
    .orderBy(asc(zonas.nombre));
}
