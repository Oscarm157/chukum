import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  socialPosts,
  socialPostImages,
  socialAccounts,
  agentProfiles,
  developments,
  developmentImages,
  type SocialPost,
  type SocialPostImage,
  type SocialAccount,
  type SocialPostStatus,
  type DevelopmentImage,
  type AgentProfile,
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

// Vecinos en el mismo orden que la lista (más reciente primero): `anterior` es el de
// arriba en la tabla y `siguiente` el de abajo. Sin filtro de estado, para poder recorrer
// todos los borradores desde el detalle.
export async function getSocialPostVecinos(
  id: string
): Promise<{ anterior: string | null; siguiente: string | null }> {
  const rows = await db.select({ id: socialPosts.id }).from(socialPosts).orderBy(desc(socialPosts.createdAt));
  const i = rows.findIndex((r) => r.id === id);
  if (i === -1) return { anterior: null, siguiente: null };
  return { anterior: rows[i - 1]?.id ?? null, siguiente: rows[i + 1]?.id ?? null };
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

// Imágenes 2+ del carrusel, en el orden en que se publican. La 1 es `post.imageUrl`.
export async function getSocialPostImages(postId: string): Promise<SocialPostImage[]> {
  return db
    .select()
    .from(socialPostImages)
    .where(eq(socialPostImages.postId, postId))
    .orderBy(asc(socialPostImages.sortOrder));
}

// Galería del desarrollo del que salió el post: es de dónde se eligen las fotos extra
// del carrusel sin volver a subirlas.
export async function getFotosDelDesarrollo(developmentId: string): Promise<DevelopmentImage[]> {
  return db
    .select()
    .from(developmentImages)
    .where(eq(developmentImages.developmentId, developmentId))
    .orderBy(asc(developmentImages.sortOrder));
}

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  return db.select().from(socialAccounts).orderBy(asc(socialAccounts.platform));
}

// Perfil del vendedor que firma los posts. Hay uno activo a la vez: la firma del overlay
// no tiene selector, siempre usa este. Si todavía no se ha llenado, devuelve null.
export async function getPerfilActivo(): Promise<AgentProfile | null> {
  const rows = await db
    .select()
    .from(agentProfiles)
    .where(eq(agentProfiles.active, true))
    .orderBy(desc(agentProfiles.updatedAt))
    .limit(1);
  return rows[0] ?? null;
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
