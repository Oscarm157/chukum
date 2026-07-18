import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { zonas, developments, type Zona } from "./schema";

export type ZonaRow = Zona & { devCount: number };

// Lista para el panel: cada zona con su número de desarrollos enlazados.
export async function getZonas(): Promise<ZonaRow[]> {
  const rows = await db.select().from(zonas).orderBy(desc(zonas.createdAt));
  const devRows = await db
    .select({ id: developments.zonaId, n: sql<number>`count(*)::int` })
    .from(developments)
    .groupBy(developments.zonaId);
  const map = new Map(devRows.filter((r) => r.id).map((r) => [r.id as string, r.n]));
  return rows.map((z) => ({ ...z, devCount: map.get(z.id) ?? 0 }));
}

export async function getZonaById(id: string): Promise<Zona | null> {
  const r = await db.select().from(zonas).where(eq(zonas.id, id));
  return r[0] ?? null;
}
