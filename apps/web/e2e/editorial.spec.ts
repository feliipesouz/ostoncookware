import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("fluxo editorial", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD não definidos");

  test("login cria coleção em rascunho e publica", async ({ page }) => {
    await loginAsAdmin(page);

    const slug = `e2e-colecao-${Date.now()}`;
    const name = `Coleção Editorial ${slug}`;
    await page.goto("/admin/colecoes/nova");
    await page.getByTestId("collection-name").fill(name);
    await page.getByTestId("collection-slug").fill(slug);
    const creation = page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/v1/admin/collections" && response.request().method() === "POST",
    );
    await page.getByTestId("save-draft").click();
    const created = await creation;
    expect(created.status()).toBe(201);
    const { data: draft } = await created.json() as { data: { id: string; slug: string; name: string; status: string; version: number } };
    expect(draft).toMatchObject({ name, slug, status: "DRAFT" });
    const editPath = `/admin/colecoes/${draft.id}`;
    const apiPath = `/v1/admin/collections/${draft.id}`;
    await expect(page).toHaveURL((url) => url.pathname === editPath, { timeout: 20_000 });
    await expect(page.getByTestId("collection-name")).toHaveValue(name);
    await expect(page.getByTestId("collection-status")).toHaveValue("DRAFT");
    await expect(page.getByTestId("save-draft")).toBeDisabled();

    const publication = page.waitForResponse((response) =>
      new URL(response.url()).pathname === apiPath && response.request().method() === "PUT",
    );
    await page.getByTestId("publish").click();
    const published = await publication;
    expect(published.ok()).toBe(true);
    expect((await published.json()).data).toMatchObject({ id: draft.id, status: "PUBLISHED", version: draft.version + 1 });
    await expect(page.getByTestId("collection-status")).toHaveValue("PUBLISHED");

    const persisted = await page.request.get(apiPath);
    expect(persisted.ok()).toBe(true);
    expect((await persisted.json()).data).toMatchObject({ id: draft.id, name, slug, status: "PUBLISHED" });
    const publicCollection = await page.request.get(`/v1/public/collections/${slug}`);
    expect(publicCollection.ok()).toBe(true);
    expect((await publicCollection.json()).data.collection).toMatchObject({ id: draft.id, name, slug });
  });

  test("histórico restaura uma versão anterior usando a versão atual para concorrência", async ({ page }) => {
    await loginAsAdmin(page);

    const token = `e2e-historico-${Date.now().toString(36)}`;
    const collectionsResponse = await page.request.get("/v1/admin/collections?q=e2e-colecao-&pageSize=50");
    expect(collectionsResponse.ok()).toBe(true);
    const { data: collections } = await collectionsResponse.json() as { data: { id: string; slug: string }[] };
    let collectionId = collections.find((collection) => collection.slug.startsWith("e2e-colecao-"))?.id;
    // Keep this fixture isolated from the official catalogue, including on a standalone run.
    if (!collectionId) {
      const collectionResponse = await page.request.post("/v1/admin/collections", {
        data: { name: "Coleção QA de histórico", slug: `${token}-colecao`, status: "DRAFT", isDemo: true },
      });
      expect(collectionResponse.status()).toBe(201);
      collectionId = (await collectionResponse.json()).data.id as string;
    }

    const originalName = `Produto QA original ${token}`;
    const editedName = `Produto QA editado ${token}`;
    const productInput = { collectionId, name: originalName, slug: token, status: "DRAFT", isDemo: true };
    const creation = await page.request.post("/v1/admin/products", { data: productInput });
    expect(creation.status()).toBe(201);
    const { data: initial } = await creation.json() as { data: { id: string; version: number } };
    const apiPath = `/v1/admin/products/${initial.id}`;
    const editing = await page.request.put(apiPath, {
      data: { ...productInput, name: editedName, expectedVersion: initial.version },
    });
    expect(editing.ok()).toBe(true);
    const { data: current } = await editing.json() as { data: { id: string; name: string; version: number } };
    expect(current).toMatchObject({ id: initial.id, name: editedName, version: initial.version + 1 });

    const editPath = `/admin/produtos/${initial.id}`;
    const versionsPath = `${apiPath}/revisions`;
    await page.goto(editPath);
    await expect(page).toHaveURL((url) => url.pathname === editPath);
    const history = page.locator(`a[href="${editPath}/historico"]`).filter({ hasText: "Histórico" });
    await expect(history).toHaveCount(1);
    const historyLoad = page.waitForResponse((response) =>
      new URL(response.url()).pathname === versionsPath && response.request().method() === "GET",
    );
    await history.click();
    await expect(page).toHaveURL((url) => url.pathname === `${editPath}/historico`, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: `Histórico · ${editedName}`, exact: true })).toBeVisible();
    const loaded = await historyLoad;
    expect(loaded.ok()).toBe(true);
    const { data: versions } = await loaded.json() as { data: { id: string; version: number; snapshot: { name: string } }[] };
    const previous = versions.find((version) => version.version === initial.version);
    expect(previous).toBeDefined();
    expect(previous!.snapshot.name).toBe(originalName);
    expect(previous!.version).toBeLessThan(current.version);

    await page.getByRole("button", { name: new RegExp(`^v${previous!.version}\\b`) }).click();
    await page.getByRole("button", { name: "Restaurar esta versão", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: `Restaurar versão ${previous!.version}`, exact: true });
    await expect(dialog).toBeVisible();
    const restoration = page.waitForResponse((response) =>
      new URL(response.url()).pathname === `${versionsPath}/${previous!.id}/restore` && response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Restaurar esta versão", exact: true }).click();
    const restored = await restoration;
    expect(restored.request().postDataJSON()).toMatchObject({ expectedVersion: current.version });
    expect(restored.ok()).toBe(true);
    expect((await restored.json()).data).toMatchObject({ id: initial.id, name: originalName, status: "DRAFT", version: current.version + 1 });
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("button", { name: new RegExp(`^v${current.version + 1}\\b`) })).toBeVisible();
    const persisted = await page.request.get(apiPath);
    expect(persisted.ok()).toBe(true);
    expect((await persisted.json()).data).toMatchObject({ id: initial.id, name: originalName, status: "DRAFT", version: current.version + 1 });
  });
});
