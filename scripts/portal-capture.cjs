// Verificación end-to-end del portal de desarrollos con captura real.
// Crea un admin temporal (estado limpio) + su cookie de sesión, ejerce el CRUD
// por la UI real, captura cada estado y AL FINAL limpia (borra el desarrollo de
// prueba y el admin temporal). No deja basura en la base.
// Correr con: node --env-file=.env.local scripts/portal-capture.cjs
const next = require("next");
const http = require("node:http");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { neon } = require("@neondatabase/serverless");
const { chromium } = require("@playwright/test");

const DIR = "/root/chukum";
const PORT = 4334;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.portal-shots`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sql = neon(process.env.DATABASE_URL);

const TEST_EMAIL = "__portal_test@chukum.local";
const TEST_SLUG = "portal-test-xyz";

function hashPassword(pw) {
  const iter = 100_000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(pw, salt, iter, 32, "sha256");
  return `pbkdf2$${iter}$${salt.toString("base64")}$${hash.toString("base64")}`;
}
function signSession(userId, iat, secret) {
  const payload = `${userId}.${iat}`;
  const mac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

async function cleanup() {
  await sql`delete from developments where slug = ${TEST_SLUG}`;
  await sql`delete from users where email = ${TEST_EMAIL}`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await cleanup(); // por si quedó de una corrida previa

  // Admin temporal limpio.
  const rows = await sql`
    insert into users (email, name, password_hash, role, must_change_password, active)
    values (${TEST_EMAIL}, 'Portal Test', ${hashPassword("x")}, 'admin', false, true)
    returning id`;
  const uid = rows[0].id;
  const token = signSession(uid, Math.floor(Date.now() / 1000), process.env.AUTH_SECRET);

  const app = next({ dev: false, dir: DIR });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
    await ctx.addCookies([{ name: "session", value: token, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
    const page = await ctx.newPage();

    // 1) Lista (estado con lo que haya + KPIs)
    await page.goto(`${BASE}/admin/desarrollos`, { waitUntil: "domcontentloaded" });
    await wait(500);
    await page.screenshot({ path: `${OUT}/1-lista.png`, fullPage: true });
    console.log("shot: 1-lista");

    // 2) Formulario de alta
    await page.goto(`${BASE}/admin/desarrollos/nuevo`, { waitUntil: "domcontentloaded" });
    await wait(400);
    await page.fill('input[name="name"]', "Desarrollo de prueba (portal)");
    await page.fill('input[name="slug"]', TEST_SLUG);
    await page.fill('input[name="heading"]', "En la costa de prueba");
    await page.fill('input[name="city"]', "Progreso");
    await page.check('input[name="propertyTypes"][value="casa"]');
    await page.check('input[name="usos"][value="invertir"]');
    await page.fill('textarea[name="descriptionEs"]', "Descripción de prueba para verificar el portal.");
    await page.fill('input[name="specLabel0"]', "Aparta con");
    await page.fill('input[name="specValue0"]', "$10,000 MXN");
    await page.screenshot({ path: `${OUT}/2-form.png`, fullPage: true });
    console.log("shot: 2-form");

    // 3) Crear → detalle
    await page.getByRole("button", { name: "Crear desarrollo" }).click();
    await page.waitForURL(/\/admin\/desarrollos\/[0-9a-f-]{36}$/, { timeout: 15000 });
    await wait(600);
    await page.screenshot({ path: `${OUT}/3-detalle.png`, fullPage: true });
    console.log("shot: 3-detalle");

    // 4) Agregar un modelo por el modal
    await page.getByRole("button", { name: "Agregar modelo" }).click();
    await wait(400);
    await page.fill('input[name="unitCode"]', "Modelo A");
    await page.fill('input[name="priceMxn"]', "1850000");
    await page.fill('input[name="areaM2"]', "120");
    await page.fill('input[name="bedrooms"]', "2");
    await page.screenshot({ path: `${OUT}/4-modal-modelo.png` });
    await page.getByRole("button", { name: "Guardar modelo" }).click();
    await wait(1200);
    await page.screenshot({ path: `${OUT}/5-con-modelo.png`, fullPage: true });
    console.log("shot: 5-con-modelo");

    // 6) Lista con el nuevo desarrollo
    await page.goto(`${BASE}/admin/desarrollos`, { waitUntil: "domcontentloaded" });
    await wait(500);
    await page.screenshot({ path: `${OUT}/6-lista-con-dato.png`, fullPage: true });
    console.log("shot: 6-lista-con-dato");

    await ctx.close();
    await browser.close();
    console.log("DONE");
  } finally {
    server.close();
    await cleanup();
    console.log("cleanup ok");
  }
  process.exit(0);
})().catch(async (e) => {
  console.error(e);
  try { await cleanup(); } catch {}
  process.exit(1);
});
