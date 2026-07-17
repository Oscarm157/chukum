import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedbackLinks } from "@/lib/schema";
import { makeRateLimiter } from "@/lib/rate-limit";

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

// openai/whisper es modelo de comunidad: se corre con hash de versión en /v1/predictions.
async function latestWhisperVersion(apiToken: string): Promise<string> {
  const r = await fetch("https://api.replicate.com/v1/models/openai/whisper", {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.detail || `model_${r.status}`);
  const v = d?.latest_version?.id;
  if (!v) throw new Error("no_version");
  return v;
}

// Crea la predicción de Whisper en Replicate y espera el resultado (poll corto).
async function transcribe(audioDataUri: string, apiToken: string): Promise<string> {
  const version = await latestWhisperVersion(apiToken);
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: { audio: audioDataUri, language: "es", transcription: "plain text" },
    }),
  });
  let data = await create.json();
  if (!create.ok) throw new Error(data?.detail || `replicate_${create.status}`);

  const getUrl: string | undefined = data?.urls?.get;
  let tries = 0;
  while ((data.status === "starting" || data.status === "processing") && getUrl && tries < 30) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(getUrl, { headers: { Authorization: `Bearer ${apiToken}` } });
    data = await poll.json();
    tries++;
  }
  if (data.status !== "succeeded") throw new Error(`status_${data.status ?? "unknown"}`);

  const out = data.output;
  return String(typeof out === "string" ? out : out?.transcription ?? "").trim();
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

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error("[feedback/transcribe] falta REPLICATE_API_TOKEN");
    return Response.json({ ok: false, error: "not_configured" }, { status: 500 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type || "audio/webm"};base64,${buf.toString("base64")}`;

  try {
    const text = await transcribe(dataUri, apiToken);
    return Response.json({ ok: true, text });
  } catch (e) {
    console.error("[feedback/transcribe] fallo Whisper", e);
    return Response.json({ ok: false, error: "transcribe_failed" }, { status: 502 });
  }
}
