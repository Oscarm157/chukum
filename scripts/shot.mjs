import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = "http://localhost:4311";
const out = "/root/vivir-en-yucatan/.pilot-shots-v2";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function capture(path, name, steps) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  for (let i = 0; i < steps; i++) {
    await page.screenshot({ path: `${out}/${name}-${i}.png` });
    await page.mouse.wheel(0, 850);
    await page.waitForTimeout(650);
  }
}

await capture("/", "home", 6);
await capture("/zonas/merida-norte", "zona", 4);
await capture("/desarrollos/ciudad-central-merida", "dev", 4);
await browser.close();
console.log("shots listos");
