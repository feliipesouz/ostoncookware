import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("fluxo editorial", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD não definidos");

  test("login cria coleção em rascunho e publica", async ({ page }) => {
    await loginAsAdmin(page);

    const slug = `e2e-colecao-${Date.now()}`;
    await page.goto("/admin/colecoes/nova");
    await page.getByTestId("collection-name").fill("Coleção Editorial E2E");
    await page.getByTestId("collection-slug").fill(slug);
    await page.getByTestId("save-draft").click();
    await expect(page.getByText(/último salvamento|rascunho/i)).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/admin\/colecoes\/.+/, { timeout: 20_000 });

    await page.getByTestId("publish").click();
    await expect(page.getByText(/publicado|publicada/i)).toBeVisible({ timeout: 20_000 });
  });

  test("histórico do produto abre e restaura se houver versão", async ({ page }) => {
    await loginAsAdmin(page);

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
