// Levanta Next (build de prod ya generado) DENTRO de este proceso node por http y
// captura /campus con Playwright. Evita el `next start` que el sandbox mata.
const next = require("next");
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const DIR = "/root/Grupo-Orve";
const PORT = 4330;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.campus-shots`;
const PW = process.env.KB_PASSWORD || "cambiar-esto";
const TOKEN = crypto.createHash("sha256").update(PW).digest("hex");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const app = next({ dev: false, dir: DIR });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  console.log("Next en " + BASE);

  const browser = await chromium.launch();
  const cookie = { name: "kb_access", value: TOKEN, url: BASE, httpOnly: true, sameSite: "Lax" };

  try {
    // 1) Gate, sin cookie. Verifica que /campus redirige a /campus/acceso.
    const gateCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const gate = await gateCtx.newPage();
    await gate.goto(`${BASE}/campus/acceso`, { waitUntil: "networkidle" });
    await gate.screenshot({ path: `${OUT}/1-acceso.png` });
    console.log("shot: acceso");
    await gate.goto(`${BASE}/campus`, { waitUntil: "domcontentloaded" });
    console.log("gate: sin cookie, /campus -> " + gate.url());
    // Verifica que el sitio publico NO esta gateado.
    await gate.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    console.log("publico: / -> " + gate.url() + " (status home no redirige)");
    await gateCtx.close();

    // 2) Contenido, con cookie.
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await ctx.addCookies([cookie]);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/campus`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/2-indice.png`, fullPage: true });
    console.log("shot: indice, url=" + page.url());

    await page.fill('input[type="search"]', "grupo");
    await wait(350);
    await page.screenshot({ path: `${OUT}/3-indice-busqueda.png`, fullPage: true });
    console.log("shot: indice-busqueda");

    await page.goto(`${BASE}/campus/induccion-02-quien-es-la-desarrolladora`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/4-ficha.png`, fullPage: true });
    console.log("shot: ficha");
    await ctx.close();

    // 3) Mobile.
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await mctx.addCookies([cookie]);
    const m = await mctx.newPage();
    await m.goto(`${BASE}/campus`, { waitUntil: "networkidle" });
    await m.screenshot({ path: `${OUT}/5-indice-mobile.png`, fullPage: true });
    console.log("shot: indice-mobile");
    await m.goto(`${BASE}/campus/medios-01-ciudad-central-acercate-a-rocio`, { waitUntil: "networkidle" });
    await m.screenshot({ path: `${OUT}/6-ficha-mobile.png`, fullPage: true });
    console.log("shot: ficha-mobile");
    await mctx.close();

    await browser.close();
    console.log("DONE");
  } finally {
    server.close();
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
