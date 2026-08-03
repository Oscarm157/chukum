// Transcripción de audio a texto vía Whisper (Replicate). Compartido por
// `/api/feedback/transcribe` (token público de feedbackLinks) y el agente de contenido
// (notas de voz de Telegram): la lógica de llamar a Replicate es la misma, solo cambia
// quién la invoca y cómo se autoriza.

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

/** Transcribe un audio (data URI) a texto en español. Lanza si falta la API key
 * (mensaje "not_configured") o si la transcripción falla. */
export async function transcribirAudio(dataUri: string): Promise<string> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) throw new Error("not_configured");
  return transcribe(dataUri, apiToken);
}
