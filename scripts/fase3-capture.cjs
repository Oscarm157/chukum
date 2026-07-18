// Smoke visual de Zonas y Leads (listas). Admin temporal + cookie, captura y limpia.
const next = require("next");
const http = require("node:http");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { neon } = require("@neondatabase/serverless");
const { chromium } = require("@playwright/test");

const DIR = "/root/chukum";
const PORT = 4335;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = `${DIR}/.portal-shots`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sql = neon(process.env.DATABASE_URL);
const TEST_EMAIL = "__portal_test@chukum.local";

function hashPassword(pw) {
  const iter = 100_000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(pw, salt, iter, 32, "sha256");
  return `pbkdf2$${iter}$${salt.toString("base64")}$${hash.toString("base64")}`;
}
function signSession(uid, iat, secret) {
  const payload = `${uid}.${iat}`;
  return `${payload}.${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
}
async function cleanup() { await sql`delete from users where email = ${TEST_EMAIL}`; }

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await cleanup();
  const rows = await sql`insert into users (email, name, password_hash, role, must_change_password, active)
    values (${TEST_EMAIL}, 'Portal Test', ${hashPassword("x")}, 'admin', false, true) returning id`;
  const token = signSession(rows[0].id, Math.floor(Date.now() / 1000), process.env.AUTH_SECRET);

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
    for (const [path, name] of [["/admin/zonas", "z-zonas"], ["/admin/leads", "z-leads"]]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      await wait(600);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      console.log("shot:", name);
    }
    await ctx.close();
    await browser.close();
    console.log("DONE");
  } finally {
    server.close();
    await cleanup();
    console.log("cleanup ok");
  }
  process.exit(0);
})().catch(async (e) => { console.error(e); try { await cleanup(); } catch {} process.exit(1); });
