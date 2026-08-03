"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  socialPosts,
  socialAccounts,
  developments,
  developmentImages,
  type SocialPlatform,
  type SocialPostStatus,
} from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { uploadImage } from "@/lib/blob";
import { BRAND } from "@/lib/site";
import { buildCaptionPrompt, type CaptionPromptInput } from "@/lib/contenido/prompt";
import { listAccounts, uploadMedia, createSocialPost, type PostForMeAccount } from "@/lib/postforme";

const PLATFORMS = ["facebook", "instagram"] as const;

// ===================== Generar borrador =====================

const generarBorradorSchema = z.object({
  sourceType: z.enum(["desarrollo", "libre"]),
  developmentId: z.string().uuid().optional(),
  topic: z.string().trim().min(1).max(500).optional(),
  imageFile: z.instanceof(File).optional(),
});

export async function generarBorrador(
  input: unknown
): Promise<{ ok: true; id: string } | { error: string }> {
  const user = await requireAdmin();

  const parsed = generarBorradorSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const v = parsed.data;

  if (!process.env.ANTHROPIC_API_KEY) return { error: "Falta ANTHROPIC_API_KEY." };

  let promptInput: CaptionPromptInput;
  let imageUrl: string;
  let imagePathname: string | null = null;
  let developmentId: string | null = null;
  let topic: string | null = null;

  if (v.sourceType === "desarrollo") {
    if (!v.developmentId) return { error: "Falta elegir un desarrollo." };
    // El id lo manda el cliente: se carga y verifica contra la DB, nunca se confía tal cual.
    const devRows = await db.select().from(developments).where(eq(developments.id, v.developmentId));
    const dev = devRows[0];
    if (!dev) return { error: "Ese desarrollo no existe." };

    const images = await db
      .select()
      .from(developmentImages)
      .where(eq(developmentImages.developmentId, dev.id))
      .orderBy(developmentImages.sortOrder);
    const hero = images.find((img) => img.kind === "hero") ?? images[0];
    if (!hero) return { error: "Ese desarrollo no tiene fotos cargadas." };

    // Algunas fotos del catálogo son rutas relativas a `public/` (no todo viene de Blob).
    // Post for Me necesita descargar la imagen, así que hace falta la URL absoluta.
    imageUrl = hero.url.startsWith("http") ? hero.url : `${BRAND.url}${hero.url}`;
    imagePathname = hero.pathname;
    developmentId = dev.id;
    // Solo se pasa el `heading` público al prompt, nunca `name` (nombre comercial
    // interno): restricción de marca dura de Chukum, ver CLAUDE.md del proyecto.
    promptInput = {
      sourceType: "desarrollo",
      desarrollo: {
        heading: dev.heading,
        city: dev.city,
        state: dev.state,
        descriptionEs: dev.descriptionEs,
        highlightSpecs: dev.highlightSpecs,
        amenities: dev.amenities,
        statusMarketing: dev.statusMarketing,
      },
    };
  } else {
    if (!v.topic) return { error: "Falta escribir el tema." };
    if (!(v.imageFile instanceof File) || v.imageFile.size === 0) {
      return { error: "Falta subir una imagen." };
    }
    const uploaded = await uploadImage("contenido", v.imageFile);
    if ("error" in uploaded) return { error: uploaded.error };
    imageUrl = uploaded.url;
    imagePathname = uploaded.pathname;
    topic = v.topic;
    promptInput = { sourceType: "libre", topic: v.topic };
  }

  const inicio = Date.now();
  let caption: string;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const mensaje = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 400,
      // Esfuerzo bajo: escribir un caption corto no necesita razonar de más.
      output_config: { effort: "low" },
      messages: [{ role: "user", content: buildCaptionPrompt(promptInput) }],
    });
    const bloque = mensaje.content.find((b) => b.type === "text");
    if (!bloque || !bloque.text.trim()) throw new Error("Claude no devolvió texto.");
    caption = bloque.text.trim();

    console.info(
      JSON.stringify({
        evento: "contenido_generar_borrador",
        usuario: user.id,
        ms: Date.now() - inicio,
        entrada: mensaje.usage.input_tokens,
        salida: mensaje.usage.output_tokens,
      })
    );
  } catch (e) {
    console.error(
      JSON.stringify({
        evento: "contenido_generar_borrador_error",
        usuario: user.id,
        error: e instanceof Error ? e.message : String(e),
      })
    );
    return { error: "No se pudo generar el caption." };
  }

  const rows = await db
    .insert(socialPosts)
    .values({
      sourceType: v.sourceType,
      developmentId,
      topic,
      caption,
      imageUrl,
      imagePathname,
      platforms: [],
      status: "borrador",
      createdBy: user.id,
    })
    .returning({ id: socialPosts.id });

  revalidatePath("/admin/contenido");
  return { ok: true, id: rows[0].id };
}

// ===================== Editar borrador =====================

const guardarEdicionSchema = z.object({
  caption: z.string().trim().min(1, "El caption no puede estar vacío."),
  imageUrl: z.string().url("La imagen debe ser una URL válida."),
  platforms: z.array(z.enum(PLATFORMS)),
});

export async function guardarEdicion(
  id: string,
  input: unknown
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  if (!z.string().uuid().safeParse(id).success) return { error: "Id inválido." };
  const parsed = guardarEdicionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const existe = await db.select({ id: socialPosts.id, status: socialPosts.status }).from(socialPosts).where(eq(socialPosts.id, id));
  if (!existe[0]) return { error: "Ese post no existe." };
  if (existe[0].status === "programado" || existe[0].status === "publicado") {
    return { error: "Este post ya se envió y no se puede editar." };
  }

  await db
    .update(socialPosts)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(socialPosts.id, id));

  revalidatePath("/admin/contenido");
  revalidatePath(`/admin/contenido/${id}`);
  return { ok: true };
}

// ===================== Reemplazar la imagen (recorte) =====================

const actualizarImagenSchema = z.object({ imageFile: z.instanceof(File) });

// Guarda el recorte que resolvió el navegador. La imagen anterior no se borra de Blob:
// en un post de `desarrollo` la URL original es una foto de la galería del catálogo y
// borrarla se llevaría el archivo del desarrollo.
export async function actualizarImagen(
  id: string,
  input: unknown
): Promise<{ ok: true; url: string } | { error: string }> {
  await requireAdmin();

  if (!z.string().uuid().safeParse(id).success) return { error: "Id inválido." };
  const parsed = actualizarImagenSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const rows = await db
    .select({ id: socialPosts.id, status: socialPosts.status })
    .from(socialPosts)
    .where(eq(socialPosts.id, id));
  if (!rows[0]) return { error: "Ese post no existe." };
  if (rows[0].status === "programado" || rows[0].status === "publicado") {
    return { error: "Este post ya se envió y no se puede editar." };
  }

  const uploaded = await uploadImage("contenido", parsed.data.imageFile);
  if ("error" in uploaded) return { error: uploaded.error };

  await db
    .update(socialPosts)
    .set({ imageUrl: uploaded.url, imagePathname: uploaded.pathname, updatedAt: new Date() })
    .where(eq(socialPosts.id, id));

  revalidatePath("/admin/contenido");
  revalidatePath(`/admin/contenido/${id}`);
  return { ok: true, url: uploaded.url };
}

// ===================== Aprobar y programar/publicar =====================

const aprobarSchema = z.object({
  scheduledAt: z.iso.datetime().nullable(),
  platforms: z.array(z.enum(PLATFORMS)).min(1, "Elige al menos una plataforma."),
});

export async function aprobarYProgramar(
  id: string,
  scheduledAtISO: string | null,
  platforms: string[]
): Promise<{ ok: true; status: SocialPostStatus } | { error: string }> {
  const user = await requireAdmin();

  if (!z.string().uuid().safeParse(id).success) return { error: "Id inválido." };
  const parsed = aprobarSchema.safeParse({ scheduledAt: scheduledAtISO, platforms });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const rows = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
  const post = rows[0];
  if (!post) return { error: "Ese post no existe." };
  if (post.status === "programado" || post.status === "publicado") {
    return { error: "Este post ya se envió a Post for Me, no se puede reenviar." };
  }

  // Las cuentas se resuelven contra lo ya sincronizado, nunca contra un id que mande el
  // cliente: si falta alguna plataforma pedida, se corta antes de llamar a Post for Me.
  const cuentas = await db
    .select()
    .from(socialAccounts)
    .where(inArray(socialAccounts.platform, parsed.data.platforms));
  const faltantes = parsed.data.platforms.filter((p) => !cuentas.some((c) => c.platform === p));
  if (faltantes.length) {
    return {
      error: `Falta conectar en Post for Me: ${faltantes.join(", ")}. Corre "Sincronizar cuentas".`,
    };
  }

  const inicio = Date.now();
  try {
    const mediaUrl = await uploadMedia(post.imageUrl);
    const resultado = await createSocialPost({
      caption: post.caption,
      accountIds: cuentas.map((c) => c.postForMeAccountId),
      mediaUrl,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      platforms: parsed.data.platforms as SocialPlatform[],
    });

    const status: SocialPostStatus = parsed.data.scheduledAt ? "programado" : "publicado";
    await db
      .update(socialPosts)
      .set({
        platforms: parsed.data.platforms,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
        postForMeId: resultado.id,
        status,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(socialPosts.id, id));

    console.info(
      JSON.stringify({
        evento: "contenido_aprobar_programar",
        usuario: user.id,
        post: id,
        ms: Date.now() - inicio,
        status,
      })
    );

    revalidatePath("/admin/contenido");
    revalidatePath(`/admin/contenido/${id}`);
    return { ok: true, status };
  } catch (e) {
    // No se relanza: se deja el post en `error` con el motivo, para que la UI lo muestre
    // en vez de perder el borrador en una excepción sin registrar.
    const mensaje = e instanceof Error ? e.message : String(e);
    console.error(
      JSON.stringify({
        evento: "contenido_aprobar_programar_error",
        usuario: user.id,
        post: id,
        error: mensaje,
      })
    );
    await db
      .update(socialPosts)
      .set({ status: "error", errorMessage: mensaje, updatedAt: new Date() })
      .where(eq(socialPosts.id, id));
    revalidatePath("/admin/contenido");
    revalidatePath(`/admin/contenido/${id}`);
    return { error: mensaje };
  }
}

// ===================== Descartar =====================

// Decisión: borrado duro (no soft-delete). Un borrador descartado no tiene valor de
// auditoría (nunca salió a redes); si ya se publicó/programó, el registro real de lo que
// pasó vive en Post for Me. Mismo patrón que `deleteDesarrollo`.
export async function descartarPost(id: string): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  if (!z.string().uuid().safeParse(id).success) return { error: "Id inválido." };

  const rows = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
  const post = rows[0];
  if (!post) return { error: "Ese post no existe." };

  // Solo se borra el blob si la imagen se subió para este post (`libre`). Si viene de
  // `desarrollo`, es una foto de la galería del catálogo: no se toca.
  if (post.sourceType === "libre" && post.imagePathname) {
    try {
      await del(post.imageUrl);
    } catch (e) {
      console.error("[contenido] fallo al borrar blob", post.imageUrl, e);
    }
  }

  await db.delete(socialPosts).where(eq(socialPosts.id, id));
  revalidatePath("/admin/contenido");
  return { ok: true };
}

// ===================== Conectar cuentas =====================
// Dos pasos a propósito: la misma API key de Post for Me puede traer cuentas de OTROS
// negocios de Oscar (no solo Chukum). Listar nunca escribe; conectar exige que Oscar
// elija explícitamente cuáles son las de Chukum, para no poder publicar sin querer en
// la página de otro cliente.

export type CuentaDisponible = PostForMeAccount & {
  platform: SocialPlatform;
  yaConectada: boolean;
};

export async function listarCuentasDisponibles(): Promise<
  { ok: true; cuentas: CuentaDisponible[] } | { error: string }
> {
  await requireAdmin();

  if (!process.env.POSTFORME_API_KEY) return { error: "Falta POSTFORME_API_KEY." };

  let cuentas: PostForMeAccount[];
  try {
    cuentas = await listAccounts();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo consultar Post for Me." };
  }

  const conectadas = new Set(
    (await db.select({ id: socialAccounts.postForMeAccountId }).from(socialAccounts)).map((c) => c.id)
  );

  // Solo facebook/instagram: son las únicas plataformas que soporta este módulo.
  const soportadas = cuentas
    .filter(
      (c): c is PostForMeAccount & { platform: SocialPlatform } =>
        c.platform === "facebook" || c.platform === "instagram"
    )
    .map((c) => ({ ...c, yaConectada: conectadas.has(c.id) }));

  return { ok: true, cuentas: soportadas };
}

const conectarCuentasSchema = z.object({
  postForMeAccountIds: z.array(z.string().min(1)).min(1, "Elige al menos una cuenta."),
});

export async function conectarCuentas(
  input: unknown
): Promise<{ ok: true; count: number } | { error: string }> {
  await requireAdmin();

  const parsed = conectarCuentasSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  if (!process.env.POSTFORME_API_KEY) return { error: "Falta POSTFORME_API_KEY." };

  // Nunca se confía platform/username que mande el cliente: se vuelve a pedir la lista
  // fresca a Post for Me y solo se guardan los ids que el propio Oscar marcó.
  let cuentas: PostForMeAccount[];
  try {
    cuentas = await listAccounts();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo consultar Post for Me." };
  }

  const elegidas = cuentas.filter(
    (c): c is PostForMeAccount & { platform: SocialPlatform } =>
      parsed.data.postForMeAccountIds.includes(c.id) &&
      (c.platform === "facebook" || c.platform === "instagram")
  );

  for (const c of elegidas) {
    await db
      .insert(socialAccounts)
      .values({ platform: c.platform, postForMeAccountId: c.id, username: c.username })
      .onConflictDoUpdate({
        target: socialAccounts.postForMeAccountId,
        set: { username: c.username },
      });
  }

  revalidatePath("/admin/contenido");
  return { ok: true, count: elegidas.length };
}
