import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

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

    await loginAsAdmin(page);

    await page.goto("/admin/colecoes/nova");
    await page.getByTestId("collection-name").fill("Coleção preview E2E");
    await page.getByTestId("collection-slug").fill(slug);
    await page.getByTestId("collection-status").selectOption("DRAFT");
    await page.getByTestId("save-draft").click();
    await expect(page).toHaveURL(/\/admin\/colecoes\/.+/, { timeout: 20_000 });

    const publicDraft = await page.request.get(`/colecoes/${slug}`);
    expect(publicDraft.status()).toBeGreaterThanOrEqual(400);

    await page.goto("/admin/colecoes");
    await page.getByRole("link", { name: /Coleção preview E2E/i }).click();
    const preview = page.getByRole("link", { name: /preview/i });
    await expect(preview).toBeVisible();

    const [previewPage] = await Promise.all([page.context().waitForEvent("page"), preview.click()]);
    await previewPage.waitForLoadState("domcontentloaded");
    expect(previewPage.url()).toContain(`/colecoes/${slug}`);
    await expect(previewPage.locator("h1")).toContainText(/preview/i, { timeout: 15_000 });

    await page.getByTestId("collection-status").selectOption("PUBLISHED");
    await page.getByTestId("publish").click();
    await expect(page.getByText(/publicado|publicada/i)).toBeVisible({ timeout: 20_000 });

    await page.goto("/api/preview/disable");
    const published = await page.goto(`/colecoes/${slug}`);
    expect(published?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
  });
});
