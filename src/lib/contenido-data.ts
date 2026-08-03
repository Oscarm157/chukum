import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  socialPosts,
  socialAccounts,
  developments,
  developmentImages,
  type SocialPost,
  type SocialAccount,
  type SocialPostStatus,
} from "./schema";

export type SocialPostRow = SocialPost & { developmentName: string | null };

// Lista del panel. `developmentName` es el nombre interno del catálogo: se usa solo
// aquí para saber de qué desarrollo salió el post, nunca en el sitio público.
export async function getSocialPosts(status?: SocialPostStatus): Promise<SocialPostRow[]> {
  const rows = await db
    .select({ post: socialPosts, developmentName: developments.name })
    .from(socialPosts)
    .leftJoin(developments, eq(socialPosts.developmentId, developments.id))
    .where(status ? eq(socialPosts.status, status) : undefined)
    .orderBy(desc(socialPosts.createdAt));
  return rows.map((r) => ({ ...r.post, developmentName: r.developmentName }));
}

export async function getSocialPostCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: socialPosts.status, n: sql<number>`count(*)::int` })
    .from(socialPosts)
    .groupBy(socialPosts.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

export async function getSocialPostById(id: string): Promise<SocialPostRow | null> {
  const rows = await db
    .select({ post: socialPosts, developmentName: developments.name })
    .from(socialPosts)
    .leftJoin(developments, eq(socialPosts.developmentId, developments.id))
    .where(eq(socialPosts.id, id));
  const r = rows[0];
  return r ? { ...r.post, developmentName: r.developmentName } : null;
}

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  return db.select().from(socialAccounts).orderBy(asc(socialAccounts.platform));
}

export type DesarrolloOption = { id: string; name: string; city: string | null; imageCount: number };

// Opciones del formulario de generación. `imageCount` importa: sin fotos cargadas,
// `generarBorrador` no puede armar el post, así que la opción se marca y se bloquea.
export async function getDesarrolloOptionsParaContenido(): Promise<DesarrolloOption[]> {
  const rows = await db
    .select({ id: developments.id, name: developments.name, city: developments.city })
    .from(developments)
    .orderBy(asc(developments.name));
  const imgRows = await db
    .select({ id: developmentImages.developmentId, n: sql<number>`count(*)::int` })
    .from(developmentImages)
    .groupBy(developmentImages.developmentId);
  const map = new Map(imgRows.map((r) => [r.id, r.n]));
  return rows.map((d) => ({ ...d, imageCount: map.get(d.id) ?? 0 }));
}
