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
    const name = `Coleção preview ${slug}`;

    await loginAsAdmin(page);

    await page.goto("/admin/colecoes/nova");
    await page.getByTestId("collection-name").fill(name);
    await page.getByTestId("collection-slug").fill(slug);
    await page.getByTestId("collection-status").selectOption("DRAFT");
    const creation = page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/v1/admin/collections" && response.request().method() === "POST",
    );
    await page.getByTestId("save-draft").click();
    const created = await creation;
    expect(created.status()).toBe(201);
    const { data: draft } = await created.json() as { data: { id: string; name: string; slug: string; status: string; version: number } };
    expect(draft).toMatchObject({ name, slug, status: "DRAFT" });
    const editPath = `/admin/colecoes/${draft.id}`;
    const apiPath = `/v1/admin/collections/${draft.id}`;
    await expect(page).toHaveURL((url) => url.pathname === editPath, { timeout: 20_000 });
    await expect(page.getByTestId("collection-status")).toHaveValue("DRAFT");

    const persistedDraft = await page.request.get(apiPath);
    expect(persistedDraft.ok()).toBe(true);
    expect((await persistedDraft.json()).data).toMatchObject({ id: draft.id, name, slug, status: "DRAFT" });
    const publicDraft = await page.request.get(`/v1/public/collections/${slug}`);
    expect(publicDraft.status()).toBe(404);

    await page.goto(`/admin/colecoes?q=${encodeURIComponent(slug)}`);
    const row = page.getByRole("row").filter({ has: page.getByRole("cell", { name: slug, exact: true }) });
    await row.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === editPath, { timeout: 20_000 });
    await expect(page.getByTestId("collection-slug")).toHaveValue(slug);
    const preview = page.getByRole("link", { name: "Preview", exact: true });
    await expect(preview).toBeVisible();
    const previewUrl = new URL((await preview.getAttribute("href"))!, page.url());
    expect(previewUrl.searchParams.get("slug")).toBe(slug);

    const [previewPage] = await Promise.all([page.waitForEvent("popup"), preview.click()]);
    await expect(previewPage).toHaveURL((url) => url.pathname === `/colecoes/${slug}`, { timeout: 20_000 });
    await expect(previewPage.getByRole("heading", { level: 1, name, exact: true })).toBeVisible({ timeout: 15_000 });
    await previewPage.close();

    await page.getByTestId("collection-status").selectOption("PUBLISHED");
    const publication = page.waitForResponse((response) =>
      new URL(response.url()).pathname === apiPath && response.request().method() === "PUT",
    );
    await page.getByTestId("publish").click();
    const publishedRecord = await publication;
    expect(publishedRecord.ok()).toBe(true);
    expect((await publishedRecord.json()).data).toMatchObject({ id: draft.id, status: "PUBLISHED", version: draft.version + 1 });
    await expect(page.getByTestId("collection-status")).toHaveValue("PUBLISHED");

    await page.goto("/api/preview/disable");
    const publicCollection = await page.request.get(`/v1/public/collections/${slug}`);
    expect(publicCollection.ok()).toBe(true);
    expect((await publicCollection.json()).data.collection).toMatchObject({ id: draft.id, name, slug });
    const published = await page.goto(`/colecoes/${slug}`);
    expect(published?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name, exact: true })).toBeVisible();
  });
});
