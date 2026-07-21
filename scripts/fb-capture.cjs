// Captura de verificación de los 4 comentarios de feedback en /inicio.
// Levanta Next (build prod) en-proceso y captura mobile + desktop de:
//  hero (C1 video izq / C2 h1), banda de azulejos sección 6 (C4), stats (C3).
// Uso: npm run build && node scripts/fb-capture.cjs
const next = require("next");
const http = require("node:http");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const DIR = "/root/chukum";
const PORT = 4337;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.fb-shots`;
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
  const shoot = async (label, viewport) => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/inicio`, { waitUntil: "networkidle" });
    await wait(700);
    // Hero (C1 + C2)
    await page.screenshot({ path: `${OUT}/${label}-hero.png` });
    // Banda de azulejos sección 6 (después del quiz)
    await page.locator("#quiz").scrollIntoViewIfNeeded();
    await wait(400);
    await page.mouse.wheel(0, 700);
    await wait(500);
    await page.screenshot({ path: `${OUT}/${label}-azulejos.png` });
    // Stats "Vivir en Mérida" (C3)
    await page.getByText("Cómo es vivir en Yucatán").scrollIntoViewIfNeeded();
    await wait(500);
    await page.screenshot({ path: `${OUT}/${label}-stats.png` });
    console.log(`shots: ${label}-hero / ${label}-azulejos / ${label}-stats`);
    await ctx.close();
  };

  try {
    await shoot("m", { width: 390, height: 844 });
    await shoot("d", { width: 1440, height: 900 });
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
})();
