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

  test("proprietário cria acesso independente sem permitir criação de OWNER", async ({ page, browser, baseURL }) => {
    test.skip(!baseURL || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname), "Cria apenas contas no banco E2E descartável");
    await loginAsAdmin(page);
    const email = `cms-editor-${Date.now()}@example.test`;
    const password = "EditorTestPassword123";
    const payload = { name: "Editor E2E", email, password, role: "EDITOR" };
    const invalid = await page.request.post("/v1/admin/users", { data: { ...payload, role: "OWNER" } });
    expect(invalid.status()).toBe(400);
    await page.goto("/admin/usuarios");
    await page.getByRole("button", { name: "Novo usuário", exact: true }).click();
    const form = page.locator("#new-user-form");
    await form.locator('input[name="name"]').fill(payload.name);
    await form.locator('input[name="email"]').fill(email);
    await form.locator('input[name="password"]').fill(password);
    await form.locator('input[name="confirmPassword"]').fill(password);
    const saving = page.waitForResponse((response) => new URL(response.url()).pathname === "/v1/admin/users" && response.request().method() === "POST");
    await form.getByRole("button", { name: "Criar acesso", exact: true }).click();
    const created = await saving;
    expect(created.status()).toBe(201);
    const result = await created.json();
    expect(result.data).toMatchObject({ name: payload.name, email, role: "EDITOR" });
    expect(result.data).not.toHaveProperty("password");
    expect(result.data).not.toHaveProperty("accounts");
    const duplicate = await page.request.post("/v1/admin/users", { data: { ...payload, email: email.toUpperCase() } });
    expect(duplicate.status()).toBe(409);
    await page.goto("/admin/usuarios");
    await expect(page.getByRole("cell", { name: email, exact: true })).toBeVisible();
    const editorContext = await browser.newContext({ baseURL });
    try {
      const login = await editorContext.request.post("/api/auth/sign-in/email", { data: { email, password }, headers: { Origin: baseURL! } });
      expect(login.ok()).toBeTruthy();
      const me = await editorContext.request.get("/v1/admin/me");
      expect((await me.json()).role).toBe("EDITOR");
      const denied = await editorContext.request.post("/v1/admin/users", { data: { ...payload, email: `other-${email}` } });
      expect(denied.status()).toBe(403);
      const ownerMe = await page.request.get("/v1/admin/me");
      expect((await ownerMe.json()).role).toBe("OWNER");
    } finally {
      await editorContext.close();
    }
  });

  test("login válido abre o dashboard e logout encerra a sessão", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: /sair/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
