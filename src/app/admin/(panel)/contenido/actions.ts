"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  socialPosts,
  socialPostImages,
  socialAccounts,
  developments,
  developmentImages,
  type SocialPlatform,
  type SocialPost,
  type SocialPostStatus,
} from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { uploadImage } from "@/lib/blob";
import { editarFoto } from "@/lib/nanobanana";
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
  return generarBorradorInterno(input, user.id);
}

// Núcleo sin el guard de sesión: lo reusa el webhook de Telegram
// (`/api/telegram/contenido`), que no tiene cookie de admin — ahí el guard de auth real
// es el secret token + chat_id validados en el route handler antes de llegar aquí.
// `generarBorrador` sigue siendo la única vía desde el panel, con `requireAdmin()`.
export async function generarBorradorInterno(
  input: unknown,
  userId: string
): Promise<{ ok: true; id: string } | { error: string }> {
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
        usuario: userId,
        ms: Date.now() - inicio,
        entrada: mensaje.usage.input_tokens,
        salida: mensaje.usage.output_tokens,
      })
    );
  } catch (e) {
    console.error(
      JSON.stringify({
        evento: "contenido_generar_borrador_error",
        usuario: userId,
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
      createdBy: userId,
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

// ===================== Carrusel: formato, destino e imágenes =====================
// La imagen 1 sigue siendo `socialPosts.imageUrl`; en `socialPostImages` viven solo las
// 2+. Instagram no acepta más de 10 media por carrusel, así que ese es el tope.

const MAX_CARRUSEL = 10;

// Carga el post y corta si ya se envió: mismo criterio que guardarEdicion/actualizarImagen.
async function postEditable(id: string): Promise<{ post: SocialPost } | { error: string }> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Id inválido." };
  const rows = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
  const post = rows[0];
  if (!post) return { error: "Ese post no existe." };
  if (post.status === "programado" || post.status === "publicado") {
    return { error: "Este post ya se envió y no se puede editar." };
  }
  return { post };
}

async function contarImagenesExtra(postId: string): Promise<number> {
  const filas = await db
    .select({ id: socialPostImages.id })
    .from(socialPostImages)
    .where(eq(socialPostImages.postId, postId));
  return filas.length;
}

function revalidarPost(id: string) {
  revalidatePath("/admin/contenido");
  revalidatePath(`/admin/contenido/${id}`);
}

const formatoSchema = z.object({
  format: z.enum(["post", "carrusel"]),
  placement: z.enum(["timeline", "stories"]),
});

export async function cambiarFormatoYPlacement(
  postId: string,
  input: unknown
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  const parsed = formatoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { format, placement } = parsed.data;

  // Post for Me convierte un carrusel con placement `stories` en N stories sueltos, no en
  // un carrusel: la combinación se rechaza en vez de aceptarse y salir distinta.
  if (placement === "stories" && format === "carrusel") {
    return { error: "Una story solo lleva una imagen. Cambia el formato a Post o publica a feed." };
  }

  const cargado = await postEditable(postId);
  if ("error" in cargado) return cargado;

  await db
    .update(socialPosts)
    .set({ format, placement, updatedAt: new Date() })
    .where(eq(socialPosts.id, postId));

  revalidarPost(postId);
  return { ok: true };
}

export async function agregarImagenCarruselDesdeCatalogo(
  postId: string,
  developmentImageId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  if (!z.string().uuid().safeParse(developmentImageId).success) return { error: "Id inválido." };
  const cargado = await postEditable(postId);
  if ("error" in cargado) return cargado;
  const { post } = cargado;

  if (post.sourceType !== "desarrollo" || !post.developmentId) {
    return { error: "Este post no salió de un desarrollo, no tiene galería de dónde elegir." };
  }

  // La foto tiene que ser del mismo desarrollo del post: el id llega del cliente y se
  // verifica contra la DB, nunca se usa tal cual.
  const fotos = await db
    .select()
    .from(developmentImages)
    .where(
      and(
        eq(developmentImages.id, developmentImageId),
        eq(developmentImages.developmentId, post.developmentId)
      )
    );
  const foto = fotos[0];
  if (!foto) return { error: "Esa foto no es de este desarrollo." };

  const existentes = await contarImagenesExtra(postId);
  // +1 por la portada (`imageUrl`) y +1 por la que se está agregando.
  if (existentes + 2 > MAX_CARRUSEL) {
    return { error: `Un carrusel no puede pasar de ${MAX_CARRUSEL} imágenes.` };
  }

  // Se copia la referencia, la foto sigue en el catálogo. Igual que en `generarBorrador`,
  // las rutas relativas de `public/` se absolutizan: Post for Me tiene que descargarla.
  await db.insert(socialPostImages).values({
    postId,
    url: foto.url.startsWith("http") ? foto.url : `${BRAND.url}${foto.url}`,
    pathname: foto.pathname,
    sortOrder: existentes,
  });

  revalidarPost(postId);
  return { ok: true };
}

export async function agregarImagenCarruselSubida(
  postId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  const cargado = await postEditable(postId);
  if ("error" in cargado) return cargado;

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No se recibió archivo." };

  const existentes = await contarImagenesExtra(postId);
  // +1 por la portada (`imageUrl`) y +1 por la que se está agregando.
  if (existentes + 2 > MAX_CARRUSEL) {
    return { error: `Un carrusel no puede pasar de ${MAX_CARRUSEL} imágenes.` };
  }

  const subida = await uploadImage("contenido", file);
  if ("error" in subida) return { error: subida.error };

  await db.insert(socialPostImages).values({
    postId,
    url: subida.url,
    pathname: subida.pathname,
    sortOrder: existentes,
  });

  revalidarPost(postId);
  return { ok: true };
}

export async function quitarImagenCarrusel(
  imageId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  if (!z.string().uuid().safeParse(imageId).success) return { error: "Id inválido." };
  const filas = await db.select().from(socialPostImages).where(eq(socialPostImages.id, imageId));
  const imagen = filas[0];
  if (!imagen) return { error: "Esa imagen no existe." };

  const cargado = await postEditable(imagen.postId);
  if ("error" in cargado) return cargado;

  // Solo se borra el blob si se subió para este post (`contenido/`). Las del catálogo
  // apuntan al archivo del desarrollo: borrarlas se llevaría la foto del desarrollo.
  if (imagen.pathname?.startsWith("contenido/")) {
    try {
      await del(imagen.url);
    } catch (e) {
      console.error("[contenido] fallo al borrar blob", imagen.url, e);
    }
  }

  await db.delete(socialPostImages).where(eq(socialPostImages.id, imageId));

  // El hueco en `sortOrder` no rompe el orden, pero deja la numeración con saltos: se
  // renumera lo que queda para que la siguiente que entre caiga al final.
  const resto = await db
    .select({ id: socialPostImages.id })
    .from(socialPostImages)
    .where(eq(socialPostImages.postId, imagen.postId))
    .orderBy(asc(socialPostImages.sortOrder));
  await Promise.all(
    resto.map((r, i) =>
      db.update(socialPostImages).set({ sortOrder: i }).where(eq(socialPostImages.id, r.id))
    )
  );

  revalidarPost(imagen.postId);
  return { ok: true };
}

export async function reordenarImagenesCarrusel(
  postId: string,
  orderedIds: string[]
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  const parsed = z.array(z.string().uuid()).safeParse(orderedIds);
  if (!parsed.success) return { error: "Orden inválido." };

  const cargado = await postEditable(postId);
  if ("error" in cargado) return cargado;

  // El update va acotado al post: un id de otro post no se toca aunque venga en la lista.
  await Promise.all(
    parsed.data.map((id, i) =>
      db
        .update(socialPostImages)
        .set({ sortOrder: i })
        .where(and(eq(socialPostImages.id, id), eq(socialPostImages.postId, postId)))
    )
  );

  revalidarPost(postId);
  return { ok: true };
}

// ===================== Editar la foto con IA =====================

const generarEdicionIASchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, "Escribe qué quieres cambiar en la foto.")
    .max(300, "La instrucción no puede pasar de 300 caracteres."),
  // La foto ya guardada llega por URL (el servidor la descarga). En la pantalla de alta
  // todavía no existe en Blob, así que ahí llega el archivo ya reducido por el navegador.
  imageUrl: z.string().url("La imagen debe ser una URL válida.").optional(),
  imageFile: z.instanceof(File).optional(),
});

// Solo genera el preview: no toca la base ni Blob. Persistir la edición pasa por
// `actualizarImagen`, igual que el recorte y el overlay de texto.
export async function generarEdicionIA(
  input: unknown
): Promise<{ ok: true; resultUrl: string } | { error: string }> {
  const user = await requireAdmin();

  const parsed = generarEdicionIASchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { prompt, imageUrl, imageFile } = parsed.data;

  const imagen = imageFile instanceof File && imageFile.size > 0 ? imageFile : imageUrl;
  if (!imagen) return { error: "Falta la imagen que se va a editar." };

  return editarFoto({ imagen, prompt, usuario: user.id });
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
  return aprobarYProgramarInterno(id, scheduledAtISO, platforms, user.id);
}

// Núcleo sin el guard de sesión, mismo motivo que `generarBorradorInterno`.
export async function aprobarYProgramarInterno(
  id: string,
  scheduledAtISO: string | null,
  platforms: string[],
  userId: string
): Promise<{ ok: true; status: SocialPostStatus } | { error: string }> {
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

  // Imagen 1 (`imageUrl`) + las del carrusel en su orden. En formato `post` sale un
  // arreglo de un solo elemento, igual que antes.
  const extra =
    post.format === "carrusel"
      ? await db
          .select({ url: socialPostImages.url })
          .from(socialPostImages)
          .where(eq(socialPostImages.postId, id))
          .orderBy(asc(socialPostImages.sortOrder))
      : [];
  const urls = [post.imageUrl, ...extra.map((i) => i.url)];

  const inicio = Date.now();
  try {
    const mediaUrls = await Promise.all(urls.map(uploadMedia));
    const resultado = await createSocialPost({
      caption: post.caption,
      accountIds: cuentas.map((c) => c.postForMeAccountId),
      mediaUrls,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      platforms: parsed.data.platforms as SocialPlatform[],
      ...(post.placement === "stories" ? { placement: "stories" as const } : {}),
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
        usuario: userId,
        post: id,
        ms: Date.now() - inicio,
        status,
        formato: post.format,
        placement: post.placement,
        imagenes: urls.length,
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
        usuario: userId,
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
  return descartarPostInterno(id);
}

// Núcleo sin el guard de sesión, mismo motivo que `generarBorradorInterno`.
export async function descartarPostInterno(id: string): Promise<{ ok: true } | { error: string }> {
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
