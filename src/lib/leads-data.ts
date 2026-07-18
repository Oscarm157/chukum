import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { leads, type LeadStatus, type LeadSource } from "./schema";

export type Lead = typeof leads.$inferSelect;

// Bandeja con filtros opcionales por estatus y fuente.
export async function getLeads(filters: { status?: LeadStatus; source?: LeadSource } = {}): Promise<Lead[]> {
  const conds: SQL[] = [];
  if (filters.status) conds.push(eq(leads.status, filters.status));
  if (filters.source) conds.push(eq(leads.source, filters.source));
  const where = conds.length ? and(...conds) : undefined;
  return db.select().from(leads).where(where).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const r = await db.select().from(leads).where(eq(leads.id, id));
  return r[0] ?? null;
}

// Conteo por estatus para los KPIs de la bandeja.
export async function getLeadCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: leads.status, n: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
