// Captura la feature "Agregar video" de /campus con Playwright, pasando el gate por
// cookie. El paso de preview se logra interceptando /campus/agregar/procesar con un
// mock (no gasta la API de IA): devuelve una ficha de ejemplo en el textarea editable.
const next = require("next");
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const DIR = "/root/chukum";
const PORT = 4331;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.add-shots`;
const PW = process.env.KB_PASSWORD || "cambiar-esto";
const TOKEN = crypto.createHash("sha256").update(PW).digest("hex");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const EXAMPLE_MD = `---
video: 4
title: Ukana Playa del Carmen
tema: Producto
duracion: "3:12"
tipo: Producto
tags: [campus, producto, ukana, playa-del-carmen]
---
# 04 · Ukana Playa del Carmen

## Resumen
Recorrido por Ukana Playa del Carmen, desarrollo vertical de la desarrolladora. Repasa ubicacion, amenidades y estado de entrega.

## Datos clave
- Desarrollo vertical entregado por la desarrolladora.
- Ubicacion: Playa del Carmen, Quintana Roo.
- Amenidades: alberca, roof garden, gimnasio.

## Puntos a recordar
- Producto vertical de la marca, distinto a los terrenos de comunidades planeadas.
- Estado: entregado y comercializado.

## Posibles preguntas de evaluación
- ¿Que tipo de producto es Ukana Playa del Carmen? → Un desarrollo vertical de departamentos.
- ¿En que ciudad esta? → Playa del Carmen, Quintana Roo.`;

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
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await ctx.addCookies([cookie]);
    const page = await ctx.newPage();

    // 1) Indice con boton "Agregar video".
    await page.goto(`${BASE}/campus`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/1-indice-boton.png` });
    console.log("shot: indice-boton");

    // 2) Formulario vacio.
    await page.goto(`${BASE}/campus/agregar`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/2-form-vacio.png`, fullPage: true });
    console.log("shot: form-vacio");

    // 3) Estado de preview (mock del handler de procesar, sin gastar IA).
    await page.route("**/campus/agregar/procesar", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          markdown: EXAMPLE_MD,
          tema: "Producto",
          title: "Ukana Playa del Carmen",
          path: "content/campus/Producto/04-ukana-playa-del-carmen.md",
        }),
      })
    );
    await page.fill("#transcript", "Hola, bienvenidos a este recorrido por Ukana Playa del Carmen, el desarrollo vertical de Orbe en la Riviera Maya. Vamos a ver la alberca, el roof garden y el gimnasio. Este proyecto ya fue entregado.");
    await page.click('button:has-text("Procesar")');
    await page.waitForSelector("textarea.font-mono", { timeout: 5000 });
    await wait(400);
    await page.screenshot({ path: `${OUT}/3-preview-editable.png`, fullPage: true });
    console.log("shot: preview-editable");
    await ctx.close();

    // 4) Mobile del formulario.
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await mctx.addCookies([cookie]);
    const m = await mctx.newPage();
    await m.goto(`${BASE}/campus/agregar`, { waitUntil: "networkidle" });
    await m.screenshot({ path: `${OUT}/4-form-mobile.png`, fullPage: true });
    console.log("shot: form-mobile");
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
