// Genera el video del hero con Kling (Replicate), image-to-video desde la foto
// real del club de playa de Ciudad Central Progreso (public/hero/club-playa-progreso.webp).
// Uso: REPLICATE_API_TOKEN=... node scripts/gen-hero-video.mjs
import fs from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) {
  console.error("Falta REPLICATE_API_TOKEN");
  process.exit(1);
}

const MODEL = "kwaivgi/kling-v3-video";
const OUT = path.resolve("public/hero/hero.mp4");
const START_IMAGE = path.resolve("public/hero/club-playa-progreso.webp");

const imgBuf = await fs.readFile(START_IMAGE);
const dataUri = `data:image/webp;base64,${imgBuf.toString("base64")}`;

const input = {
  start_image: dataUri,
  mode: "pro",
  generate_audio: false,
  prompt:
    "Cinematic real estate establishing shot: slow smooth forward camera push over a modern beachfront villa with palm trees and an infinity pool, gentle drift, soft breeze moving the palm leaves and cabana curtains, sunlight glinting subtly on the pool water surface, clear blue sky with slow-moving clouds. Premium architectural film look, shallow depth of field, fine grain, photorealistic. The villa, pool and cabanas stay perfectly solid and rigid.",
  negative_prompt:
    "deforming building, morphing architecture, warping, melting, rubbery shapes, fog, smoke, haze, white-out, glitch, cartoon, low quality, text, watermark, people appearing or disappearing",
  duration: 5,
};

const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
  body: JSON.stringify({ input }),
});
let data = await res.json();
if (!res.ok) {
  console.error("Error inicial:", res.status, JSON.stringify(data));
  process.exit(1);
}

let tries = 0;
while (data.status && data.status !== "succeeded" && data.status !== "failed" && tries < 200) {
  await new Promise((r) => setTimeout(r, 4000));
  const g = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
  data = await g.json();
  tries++;
  if (tries % 5 === 0) console.log(`...${data.status} (${tries})`);
}
if (data.status !== "succeeded") {
  console.error("Falló:", JSON.stringify(data.error || data.status));
  process.exit(1);
}

const url = Array.isArray(data.output) ? data.output[0] : data.output;
const vid = await fetch(url);
const buf = Buffer.from(await vid.arrayBuffer());
await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, buf);
console.log(`✓ video -> ${OUT} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
