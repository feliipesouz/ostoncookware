import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("fluxo editorial", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD não definidos");

  test("login cria coleção em rascunho e publica", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 });

    const slug = `e2e-colecao-${Date.now()}`;
    await page.goto("/admin/colecoes/nova");
    await page.getByLabel("Nome").fill("Coleção Editorial E2E");
    await page.getByLabel("Slug").fill(slug);
    await page.getByTestId("save-draft").click();
    await expect(page.getByText(/último salvamento|rascunho/i)).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(new RegExp(`/admin/colecoes/.+`), { timeout: 20_000 });

    await page.getByTestId("publish").click();
    await expect(page.getByText(/publicado|publicada/i)).toBeVisible({ timeout: 20_000 });
  });

  test("histórico do produto abre e restaura se houver versão", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 });

    await page.goto("/admin/produtos");
    const first = page.locator('table a[href^="/admin/produtos/"]').first();
    test.skip((await first.count()) === 0, "Sem produtos para abrir histórico");
    await first.click();
    await page.getByRole("link", { name: /histórico/i }).click();
    await expect(page.getByRole("heading", { name: /histórico/i })).toBeVisible({ timeout: 20_000 });

    const restore = page.getByRole("button", { name: /restaurar esta versão/i }).first();
    if ((await restore.count()) === 0) {
      test.info().annotations.push({ type: "note", description: "Sem versões para restaurar" });
      return;
    }
    await page.getByText(/^v\d+/).first().click();
    await restore.click();
    await page.getByRole("button", { name: /^restaurar esta versão$/i }).click();
    await expect(page.getByText(/v\d+/).first()).toBeVisible({ timeout: 20_000 });
  });
});
