import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedbackLinks } from "@/lib/schema";
import { makeRateLimiter } from "@/lib/rate-limit";
import { transcribirAudio } from "@/lib/transcribe";

export const runtime = "nodejs";
export const maxDuration = 60;

// Anti-abuso: 20 transcripciones por minuto por IP (best-effort, por instancia).
const limiter = makeRateLimiter(60_000, 20);
const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // ~8MB: varios minutos de audio opus

async function tokenActive(token: string | null): Promise<boolean> {
  if (!token) return false;
  const rows = await db
    .select({ id: feedbackLinks.id })
    .from(feedbackLinks)
    .where(and(eq(feedbackLinks.token, token), eq(feedbackLinks.active, true)))
    .limit(1);
  return rows.length > 0;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limiter(ip)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const token = typeof form?.get("token") === "string" ? (form.get("token") as string) : null;
  if (!(await tokenActive(token))) {
    return Response.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const file = form?.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: "no_audio" }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return Response.json({ ok: false, error: "too_large" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type || "audio/webm"};base64,${buf.toString("base64")}`;

  try {
    const text = await transcribirAudio(dataUri);
    return Response.json({ ok: true, text });
  } catch (e) {
    if (e instanceof Error && e.message === "not_configured") {
      console.error("[feedback/transcribe] falta REPLICATE_API_TOKEN");
      return Response.json({ ok: false, error: "not_configured" }, { status: 500 });
    }
    console.error("[feedback/transcribe] fallo Whisper", e);
    return Response.json({ ok: false, error: "transcribe_failed" }, { status: 502 });
  }
}
