import { test, expect } from "@playwright/test";

test("login renderiza y se captura", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /entrar|iniciar/i })).toBeVisible();
  await page.screenshot({ path: "e2e/__screenshots__/login.png", fullPage: true });
});

test("home pública renderiza sin redirigir a login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/inicio/);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});
