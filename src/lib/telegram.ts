// Cliente mínimo de la Bot API de Telegram para el bot de contenido de Chukum
// (`/api/telegram/contenido`). Server-only: nunca importar desde un Client Component.
// El token vive solo en `TELEGRAM_CHUKUM_BOT_TOKEN` (.env.local + Vercel), nunca se loguea.

export type InlineKeyboardButton =
  | { text: string; callback_data: string }
  | { text: string; url: string };

export type InlineKeyboardMarkup = { inline_keyboard: InlineKeyboardButton[][] };

async function llamar(metodo: string, body: Record<string, unknown>): Promise<unknown> {
  const token = process.env.TELEGRAM_CHUKUM_BOT_TOKEN;
  if (!token) {
    console.error(JSON.stringify({ evento: "telegram_api_error", metodo, error: "Falta TELEGRAM_CHUKUM_BOT_TOKEN." }));
    return null;
  }

  let res: Response;
  try {
    res = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(JSON.stringify({ evento: "telegram_api_error", metodo, error: e instanceof Error ? e.message : String(e) }));
    return null;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || (data && typeof data === "object" && "ok" in data && data.ok === false)) {
    console.error(
      JSON.stringify({
        evento: "telegram_api_error",
        metodo,
        status: res.status,
        descripcion: data && typeof data === "object" && "description" in data ? data.description : null,
      })
    );
  }
  return data;
}

export function sendMessage(chatId: number, text: string): Promise<unknown> {
  return llamar("sendMessage", { chat_id: chatId, text });
}

export function sendPhoto(
  chatId: number,
  photoUrl: string,
  caption: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<unknown> {
  return llamar("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<unknown> {
  return llamar("answerCallbackQuery", { callback_query_id: callbackQueryId, ...(text ? { text } : {}) });
}

export function editMessageReplyMarkup(
  chatId: number,
  messageId: number,
  markup: InlineKeyboardMarkup
): Promise<unknown> {
  return llamar("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: markup });
}
