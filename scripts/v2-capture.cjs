// Verificación visual de la V2 Chukum (/inicio). Levanta Next (build prod) en-proceso y
// captura desktop + mobile con Playwright, recorriendo el quiz de punta a punta.
const next = require("next");
const http = require("node:http");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const DIR = "/root/chukum";
const PORT = 4331;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.v2-shots`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runQuiz(page) {
  await page.getByRole("button", { name: /Invertir/ }).click();
  await wait(500);
  await page.getByRole("button", { name: /Caribe/ }).click();
  await wait(500);
  await page.getByRole("button", { name: /Departamento/ }).click();
  await wait(500);
  await page.getByRole("button", { name: /Cualquiera/ }).click();
  await wait(700);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const app = next({ dev: false, dir: DIR });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  console.log("Next en " + BASE);

  const browser = await chromium.launch();
  try {
    // ---------- DESKTOP ----------
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    // Simula éxito del endpoint para capturar el estado "enviado".
    await ctx.route("**/api/leads", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
    );
    const page = await ctx.newPage();
    await page.goto(`${BASE}/inicio`, { waitUntil: "networkidle" });
    await wait(600);
    await page.screenshot({ path: `${OUT}/d1-hero.png` });
    console.log("shot: d1-hero");

    // scroll completo para disparar reveals, luego fullPage
    for (let y = 0; y < 6; y++) {
      await page.mouse.wheel(0, 900);
      await wait(250);
    }
    await page.screenshot({ path: `${OUT}/d2-full.png`, fullPage: true });
    console.log("shot: d2-full");

    // Quiz: pregunta 1
    await page.locator("#quiz").scrollIntoViewIfNeeded();
    await wait(500);
    await page.screenshot({ path: `${OUT}/d3-quiz-q1.png` });
    console.log("shot: d3-quiz-q1");

    // Recorrer quiz → resultado
    await runQuiz(page);
    await page.locator("#quiz").scrollIntoViewIfNeeded();
    await wait(400);
    await page.screenshot({ path: `${OUT}/d4-quiz-result.png` });
    console.log("shot: d4-quiz-result, matchVisible=" + (await page.getByText("Esto encaja contigo").isVisible()));

    // Enviar captura → estado enviado
    const qf = page.locator("#quiz");
    await qf.getByPlaceholder("Tu nombre…").fill("Oscar Prueba");
    await qf.getByPlaceholder("999 000 0000…").fill("9990001122");
    await qf.getByRole("button", { name: /Solicitar disponibilidad/ }).click();
    await wait(700);
    await page.screenshot({ path: `${OUT}/d5-quiz-sent.png` });
    console.log("shot: d5-quiz-sent, sentVisible=" + (await page.getByText("recibimos tus datos").isVisible()));
    await ctx.close();

    // ---------- MOBILE ----------
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await mctx.route("**/api/leads", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
    );
    const m = await mctx.newPage();
    await m.goto(`${BASE}/inicio`, { waitUntil: "networkidle" });
    await wait(600);
    await m.screenshot({ path: `${OUT}/m1-hero.png` });
    console.log("shot: m1-hero (bottom bar visible)");

    // Menú hamburguesa
    await m.getByRole("button", { name: "Abrir menú" }).click();
    await wait(400);
    await m.screenshot({ path: `${OUT}/m2-menu.png` });
    console.log("shot: m2-menu");
    await m.getByRole("button", { name: "Cerrar menú" }).click();
    await wait(300);

    // Quiz mobile
    await m.locator("#quiz").scrollIntoViewIfNeeded();
    await wait(400);
    await m.screenshot({ path: `${OUT}/m3-quiz.png` });
    console.log("shot: m3-quiz");
    await runQuiz(m);
    await m.locator("#quiz").scrollIntoViewIfNeeded();
    await wait(400);
    await m.screenshot({ path: `${OUT}/m4-quiz-result.png`, fullPage: true });
    console.log("shot: m4-quiz-result");

    // Full page mobile
    await m.screenshot({ path: `${OUT}/m5-full.png`, fullPage: true });
    console.log("shot: m5-full");
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
