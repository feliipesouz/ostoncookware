import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("auth session", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD não definidos");

  test("login válido abre o dashboard e logout encerra a sessão", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
    await page.getByRole("button", { name: /sair/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
