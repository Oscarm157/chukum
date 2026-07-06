// Fase 2: captura /vivir-en-merida/zonas/[slug] y /desarrollos/[slug] + prueba POST /api/leads.
// Levanta Next (build de prod ya generado) dentro de este proceso node.
const next = require("next");
const http = require("node:http");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const DIR = "/root/Grupo-Orve";
const PORT = 4331;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.unif-shots`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Pase de scroll para disparar los Reveal (IntersectionObserver) antes del shot.
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await wait(400);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const app = next({ dev: false, dir: DIR });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  console.log("Next en " + BASE);

  const routes = [
    ["zona-merida-norte", "/vivir-en-merida/zonas/merida-norte"],
    ["desarrollo-ciudad-central", "/vivir-en-merida/desarrollos/ciudad-central-merida"],
  ];

  const browser = await chromium.launch();
  try {
    // Desktop
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    for (const [name, path] of routes) {
      const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await scrollThrough(page);
      await page.screenshot({ path: `${OUT}/f2-${name}.png`, fullPage: true });
      console.log(`shot: ${name} status=${res.status()} url=${page.url()}`);
    }
    await ctx.close();

    // Mobile
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const m = await mctx.newPage();
    for (const [name, path] of routes) {
      await m.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await scrollThrough(m);
      await m.screenshot({ path: `${OUT}/f2-${name}-mobile.png`, fullPage: true });
      console.log(`shot: ${name}-mobile`);
    }
    await mctx.close();
    await browser.close();

    // Prueba del endpoint de leads (in-process).
    async function post(body) {
      const res = await fetch(`${BASE}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      return { status: res.status, json };
    }
    console.log("LEADS valido:", JSON.stringify(await post({
      name: "Prueba F2", email: `f2-${Date.now()}@example.com`, phone: "9990000000",
      message: "Test", source: "form", sourceUrl: "/vivir-en-merida/zonas/merida-norte",
      zonaSlug: "merida-norte",
    })));
    console.log("LEADS sin contacto:", JSON.stringify(await post({ name: "Sin contacto" })));
    console.log("LEADS body malo:", JSON.stringify(await post({ email: 123 })));
    console.log("DONE");
  } finally {
    server.close();
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
