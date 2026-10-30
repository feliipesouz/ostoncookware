import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("auth session", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD não definidos");

  test("sessão persiste ao voltar do site e login reconhece usuário autenticado", async ({ page, context }) => {
    await loginAsAdmin(page);
    const token = (await context.cookies()).find((cookie) => cookie.name.endsWith("session_token"));
    expect(token).toBeDefined();
    expect(token!.path).toBe("/");
    expect(token!.expires - Date.now() / 1000).toBeGreaterThan(24 * 60 * 60);
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/admin\/?$/);
    await page.getByRole("button", { name: /sair/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("dashboard mantém listas compactas e amplia em modal acessível", async ({ page }) => {
    await loginAsAdmin(page);
    const panel = page.getByRole("region", { name: "Últimas alterações", exact: true });
    expect((await panel.boundingBox())!.height).toBeLessThanOrEqual(321);
    const expand = page.getByRole("button", { name: "Ampliar Últimas alterações", exact: true });
    await expand.click();
    const modal = page.getByRole("dialog", { name: "Últimas alterações", exact: true });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("link", { name: "Ver auditoria completa" })).toHaveAttribute("href", "/admin/auditoria");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(expand).toBeFocused();
    await expand.click();
    await modal.getByRole("button", { name: "Fechar visão ampliada" }).click();
    await expect(modal).not.toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("login válido abre o dashboard e logout encerra a sessão", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: /sair/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
