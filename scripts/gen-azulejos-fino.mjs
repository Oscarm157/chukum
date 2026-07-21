// Genera una banda de azulejos con tiles MÁS CHICOS que azulejos-mar.webp, para reemplazar
// el video de olas de la sección 6 del home por una banda fija. Grid plano top-down, sin
// perspectiva, turquesa cenote + crema, artesanal. Salida a .stat-cand/azulejos-fino.webp.
// Uso: REPLICATE_API_TOKEN=... node scripts/gen-azulejos-fino.mjs
import fs from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error("Falta REPLICATE_API_TOKEN"); process.exit(1); }

const OUTDIR = path.resolve(".stat-cand");
await fs.mkdir(OUTDIR, { recursive: true });

const MODEL = "google/nano-banana-pro";

async function run(input) {
  const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({ input }),
  });
  let data = await res.json();
  let tries = 0;
  while (data.urls?.get && data.status !== "succeeded" && data.status !== "failed" && tries < 120) {
    await new Promise((r) => setTimeout(r, 3000));
    const g = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
    data = await g.json();
    tries++;
  }
  if (data.status !== "succeeded") throw new Error(JSON.stringify(data.error || data.detail || data));
  return Array.isArray(data.output) ? data.output[0] : data.output;
}

async function save(name, url) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  const out = path.join(OUTDIR, name);
  await fs.writeFile(out, buf);
  console.log(`✓ ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
}

const prompt =
  "Flat top-down photograph of a dense seamless grid of small square hand-painted Yucatecan talavera ceramic tiles, roughly 12 tiles across, cenote turquoise-green and cream with subtle marine motifs, artisanal, even soft studio light, no perspective, no shadows, tileable pattern. No text, no logos, no watermark.";

for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    await save("azulejos-fino.jpg", await run({ prompt, aspect_ratio: "16:9", resolution: "2K", output_format: "jpg" }));
    break;
  } catch (e) {
    console.error(`✗ azulejos-fino (intento ${attempt}):`, String(e).slice(0, 120));
    await new Promise((r) => setTimeout(r, 15000));
  }
}
console.log("DONE ->", OUTDIR);
