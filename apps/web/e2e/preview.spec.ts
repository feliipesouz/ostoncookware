import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test("preview sem sessão é recusado", async ({ request }) => {
  const response = await request.get("/api/preview?type=home&path=/", { maxRedirects: 0 });
  expect(response.status()).toBe(401);
});

test("preview recusa open redirect", async ({ request }) => {
  const response = await request.get("/api/preview?type=home&path=https://evil.com", {
    maxRedirects: 0,
  });
  expect([401, 403]).toContain(response.status());
});

test.describe("preview editorial", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD não definidos");

  test("rascunho de coleção abre no preview e some do público até publicar", async ({ page }) => {
    const slug = `preview-e2e-${Date.now().toString(36)}`;

    await page.goto("/admin/login");
    await page.locator('input[name="email"]').fill(email!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });

    await page.goto("/admin/colecoes/nova");
    await page.locator("label:has-text('Nome') input").fill("Coleção preview E2E");
    await page.locator("label:has-text('Slug') input").fill(slug);
    await page.locator("label:has-text('Status') select").selectOption("DRAFT");
    await page.getByRole("button", { name: /salvar coleção/i }).click();
    await expect(page).toHaveURL(/\/admin\/colecoes/, { timeout: 20_000 });

    const publicDraft = await page.request.get(`/colecoes/${slug}`);
    expect(publicDraft.status()).toBeGreaterThanOrEqual(400);

    await page.goto(`/admin/colecoes`);
    await page.getByRole("link", { name: /Coleção preview E2E/i }).click();
    const preview = page.getByRole("link", { name: /preview/i });
    await expect(preview).toBeVisible();

    const [previewPage] = await Promise.all([page.context().waitForEvent("page"), preview.click()]);
    await previewPage.waitForLoadState("domcontentloaded");
    expect(previewPage.url()).toContain(`/colecoes/${slug}`);
    await expect(previewPage.locator("h1")).toContainText(/preview/i, { timeout: 15_000 });

    await page.locator("label:has-text('Status') select").selectOption("PUBLISHED");
    await page.getByRole("button", { name: /salvar coleção/i }).click();
    await expect(page).toHaveURL(/\/admin\/colecoes/, { timeout: 20_000 });

    await page.goto(`/api/preview/disable`);
    const published = await page.goto(`/colecoes/${slug}`);
    expect(published?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
  });
});
