// Webhook del bot de Telegram de contenido social de Chukum (Fase 5 del módulo
// /admin/contenido). Bot nuevo y separado de Ralph (cos-bridge): no pasa por un agente,
// llama directo a las server actions ya existentes.
//
// Alta del webhook (Oscar, una sola vez, con el token real de @BotFather):
//
//   curl -s "https://api.telegram.org/bot<TELEGRAM_CHUKUM_BOT_TOKEN>/setWebhook" \
//     -H "Content-Type: application/json" \
//     -d '{"url": "https://chukum.mx/api/telegram/contenido", "secret_token": "<TELEGRAM_CHUKUM_WEBHOOK_SECRET>"}'
//
// El chat_id se captura escribiéndole al bot una vez y leyendo `message.chat.id` de:
//
//   curl -s "https://api.telegram.org/bot<TELEGRAM_CHUKUM_BOT_TOKEN>/getUpdates"
//
// Ese valor va en TELEGRAM_CHUKUM_CHAT_ID (.env.local + Vercel Production).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { developments, developmentImages, users, socialAccounts, socialPosts, type SocialPlatform } from "@/lib/schema";
import { BRAND } from "@/lib/site";
import {
  generarBorradorInterno,
  aprobarYProgramarInterno,
  descartarPostInterno,
} from "@/app/admin/(panel)/contenido/actions";
import {
  sendMessage,
  sendPhoto,
  answerCallbackQuery,
  editMessageReplyMarkup,
  type InlineKeyboardMarkup,
} from "@/lib/telegram";

export const runtime = "nodejs";

// Shape laxo del Update de Telegram: solo se valida lo que se usa, con `.passthrough()`
// para no romper con campos que Telegram manda y no importan aquí.
const chatSchema = z.object({ id: z.number() }).passthrough();

const telegramUpdateSchema = z
  .object({
    message: z
      .object({
        message_id: z.number(),
        chat: chatSchema,
        text: z.string().optional(),
      })
      .passthrough()
      .optional(),
    callback_query: z
      .object({
        id: z.string(),
        data: z.string().optional(),
        message: z
          .object({
            message_id: z.number(),
            chat: chatSchema,
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const CAPTION_MAX = 1024; // límite real de Telegram para `caption`.

function teclado(id: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "✅ Aprobar y publicar", callback_data: `aprobar:${id}` },
        { text: "🗑 Descartar", callback_data: `descartar:${id}` },
      ],
      [{ text: "Editar en el panel", url: `${BRAND.url}/admin/contenido/${id}` }],
    ],
  };
}

// Las acciones disparadas desde Telegram no tienen sesión de admin (no hay cookie): se
// atribuyen al primer usuario admin real de la tabla `users`. El guard de auth de este
// endpoint es el secret token + chat_id validados en `POST`, no una sesión de navegador.
async function getAdminUserId(): Promise<string | null> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(asc(users.createdAt))
    .limit(1);
  return rows[0]?.id ?? null;
}

async function manejarDesarrollos(chatId: number) {
  const filas = await db
    .selectDistinct({ name: developments.name })
    .from(developments)
    .innerJoin(developmentImages, eq(developmentImages.developmentId, developments.id))
    .orderBy(asc(developments.name));

  if (filas.length === 0) {
    await sendMessage(chatId, "No hay desarrollos con fotos cargadas todavía.");
    return;
  }
  await sendMessage(chatId, `Desarrollos disponibles:\n${filas.map((f) => `- ${f.name}`).join("\n")}`);
}

async function manejarPost(chatId: number, texto: string) {
  const nombre = texto.trim();
  if (!nombre) {
    await sendMessage(chatId, "Escribe /post seguido del nombre del desarrollo, ej. /post Xo'ok.");
    return;
  }

  const matches = await db
    .select({ id: developments.id, name: developments.name })
    .from(developments)
    .where(ilike(developments.name, `%${nombre}%`));

  if (matches.length === 0) {
    await sendMessage(chatId, `No encontré ningún desarrollo con "${nombre}". Prueba /desarrollos para ver la lista.`);
    return;
  }
  if (matches.length > 1) {
    await sendMessage(
      chatId,
      `Encontré varios: ${matches.map((m) => m.name).join(", ")}. Sé más específico.`
    );
    return;
  }

  const userId = await getAdminUserId();
  if (!userId) {
    console.error(JSON.stringify({ evento: "telegram_contenido_error", error: "No hay usuario admin en la base." }));
    await sendMessage(chatId, "Error interno: no hay usuario admin para atribuir el post.");
    return;
  }

  const resultado = await generarBorradorInterno({ sourceType: "desarrollo", developmentId: matches[0].id }, userId);
  if ("error" in resultado) {
    await sendMessage(chatId, `No se pudo generar el post: ${resultado.error}`);
    return;
  }

  const filas = await db.select().from(socialPosts).where(eq(socialPosts.id, resultado.id));
  const post = filas[0];
  if (!post) {
    await sendMessage(chatId, "El post se generó pero no lo pude leer de vuelta. Revísalo en el panel.");
    return;
  }

  const caption = post.caption.length > CAPTION_MAX ? `${post.caption.slice(0, CAPTION_MAX - 1)}…` : post.caption;
  await sendPhoto(chatId, post.imageUrl, caption, teclado(post.id));
}

async function manejarMensaje(chatId: number, text: string) {
  if (text.startsWith("/desarrollos")) {
    await manejarDesarrollos(chatId);
    return;
  }
  if (text.startsWith("/post")) {
    await manejarPost(chatId, text.slice("/post".length));
    return;
  }
  await sendMessage(
    chatId,
    "Comandos disponibles:\n/desarrollos — lista los desarrollos con fotos\n/post <nombre> — genera un borrador de ese desarrollo"
  );
}

async function manejarCallback(
  callbackQueryId: string,
  chatId: number,
  messageId: number,
  data: string | undefined
) {
  // Siempre se responde primero, o el botón se queda "cargando" para siempre en el celular.
  await answerCallbackQuery(callbackQueryId);

  if (!data) return;
  const [accion, postId] = data.split(":");
  if (!z.string().uuid().safeParse(postId).success) return;
  if (accion !== "aprobar" && accion !== "descartar") return;

  if (accion === "descartar") {
    const resultado = await descartarPostInterno(postId);
    await editMessageReplyMarkup(chatId, messageId, { inline_keyboard: [] });
    await sendMessage(chatId, "error" in resultado ? `Error: ${resultado.error}` : "Descartado.");
    return;
  }

  // aprobar: sin selector de plataforma en Telegram, se publica a todas las conectadas.
  const cuentas = await db.select({ platform: socialAccounts.platform }).from(socialAccounts);
  const platforms = [...new Set(cuentas.map((c) => c.platform))] as SocialPlatform[];
  if (platforms.length === 0) {
    await editMessageReplyMarkup(chatId, messageId, { inline_keyboard: [] });
    await sendMessage(chatId, "No hay cuentas conectadas. Sincroniza cuentas en el panel primero.");
    return;
  }

  const userId = await getAdminUserId();
  if (!userId) {
    console.error(JSON.stringify({ evento: "telegram_contenido_error", error: "No hay usuario admin en la base." }));
    await sendMessage(chatId, "Error interno: no hay usuario admin para atribuir la publicación.");
    return;
  }

  const resultado = await aprobarYProgramarInterno(postId, null, platforms, userId);
  await editMessageReplyMarkup(chatId, messageId, { inline_keyboard: [] });
  if ("error" in resultado) {
    await sendMessage(chatId, `No se pudo publicar: ${resultado.error}`);
  } else {
    await sendMessage(chatId, resultado.status === "publicado" ? "Publicado." : "Programado.");
  }
}

export async function POST(req: NextRequest) {
  // 1) Header de secreto: sin esto, cualquiera que adivine la URL podría disparar una
  // publicación real. No se le da pista al llamante de qué falló: siempre 200 OK vacío
  // salvo que falte la propia configuración del servidor.
  const secretoEsperado = process.env.TELEGRAM_CHUKUM_WEBHOOK_SECRET;
  if (!secretoEsperado) {
    console.error(JSON.stringify({ evento: "telegram_contenido_error", error: "Falta TELEGRAM_CHUKUM_WEBHOOK_SECRET." }));
    return NextResponse.json({ error: "Webhook sin configurar." }, { status: 503 });
  }
  const secretoRecibido = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretoRecibido !== secretoEsperado) {
    return NextResponse.json({});
  }

  // 2) Zod sobre el body: nunca confiar en el shape del update sin validar.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({});
  }
  const parsed = telegramUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({});
  const update = parsed.data;

  // 3) chat_id: solo se procesa el chat de Oscar. Sin la env var, no hay forma de
  // verificar, así que se corta por default (no se asume nada).
  const chatIdEsperadoRaw = process.env.TELEGRAM_CHUKUM_CHAT_ID;
  const chatIdEsperado = chatIdEsperadoRaw ? Number(chatIdEsperadoRaw) : NaN;
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
  if (!chatId || Number.isNaN(chatIdEsperado) || chatId !== chatIdEsperado) {
    return NextResponse.json({});
  }

  try {
    if (update.callback_query) {
      const messageId = update.callback_query.message?.message_id;
      if (messageId) {
        await manejarCallback(update.callback_query.id, chatId, messageId, update.callback_query.data);
      } else {
        await answerCallbackQuery(update.callback_query.id);
      }
    } else if (update.message?.text) {
      await manejarMensaje(chatId, update.message.text);
    }
  } catch (e) {
    console.error(
      JSON.stringify({
        evento: "telegram_contenido_error",
        error: e instanceof Error ? e.message : String(e),
      })
    );
  }

  return NextResponse.json({});
}
