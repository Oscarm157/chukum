// Captura la sección catálogo (#desarrollos) con las pills de ciudad en 3 estados:
// inicial (5 cards), Mérida seleccionada (1 card + Borrar), y tras Borrar (vuelve a 5).
const next = require("next");
const http = require("node:http");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const DIR = "/root/chukum";
const PORT = 4333;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.pills-shots`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const app = next({ dev: false, dir: DIR });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/inicio`, { waitUntil: "networkidle" });
    const section = page.locator("#desarrollos");
    await section.scrollIntoViewIfNeeded();
    await wait(700);

    await section.screenshot({ path: `${OUT}/1-inicial.png` });
    console.log("shot: 1-inicial (deberia mostrar 5 cards, sin Borrar)");

    await page.getByRole("button", { name: "Mérida", exact: true }).click();
    await wait(600);
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: `${OUT}/2-merida.png` });
    console.log("shot: 2-merida (1 card + pill Borrar)");

    await page.getByRole("button", { name: "Tulum", exact: true }).click();
    await wait(600);
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: `${OUT}/3-merida-tulum.png` });
    console.log("shot: 3-merida-tulum (2 cards)");

    await page.getByRole("button", { name: "Borrar" }).click();
    await wait(600);
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: `${OUT}/4-borrado.png` });
    console.log("shot: 4-borrado (vuelve a 5 cards, sin Borrar)");

    await ctx.close();
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
