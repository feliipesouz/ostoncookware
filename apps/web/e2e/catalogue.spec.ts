import { expect, test, type APIRequestContext } from "@playwright/test";

type Collection = { id: string; name: string; slug: string };
type Product = {
  id: string; name: string; slug: string; collectionId: string; collectionSlug?: string;
  images: { id: string; url: string }[]; specifications: { label: string; value: string }[];
  itemsIncluded: string[]; isDemo: boolean; price?: string | null;
};

async function catalogCollections(request: APIRequestContext): Promise<Collection[]> {
  const response = await request.get("/v1/public/collections");
  expect(response.ok(), "O catálogo precisa estar disponível para validar a jornada").toBeTruthy();
  const { data } = await response.json();
  expect(data.length, "Rode o seed do catálogo antes deste teste").toBeGreaterThan(0);
  return data;
}

async function firstProduct(request: APIRequestContext) {
  for (const collection of await catalogCollections(request)) {
    const response = await request.get("/v1/public/collections/" + collection.slug);
    expect(response.ok()).toBeTruthy();
    const { data } = await response.json();
    if (data.products.length > 0) return { product: data.products[0] as Product, collection };
  }
  throw new Error("O catálogo de teste deve conter ao menos um produto publicado.");
}

test("catálogo permite busca sem acento e comparação de até três coleções", async ({ page, request }) => {
  const collections = await catalogCollections(request);
  await page.goto("/colecoes");
  const name = collections[0]!.name;
  const input = page.getByRole("searchbox", { name: "Buscar uma coleção" });
  await input.fill(name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await input.fill("um-termo-que-nao-existe-92");
  await expect(page.getByText("Vamos ampliar a busca?")).toBeVisible();
  await page.getByRole("button", { name: "Mostrar tudo" }).click();
  const compare = page.getByRole("button", { name: /^Comparar / });
  for (let index = 0; index < Math.min(3, collections.length); index++) await compare.nth(index).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(Math.min(3, collections.length));
  if (collections.length > 3) await expect(compare.nth(3)).toBeDisabled();
  await page.getByRole("button", { name: "Limpar seleção" }).click();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("produto expõe galeria, composição e consulta com contexto", async ({ page, request }) => {
  const { product, collection } = await firstProduct(request);
  await page.goto("/produtos/" + product.slug);
  await expect(page.getByRole("heading", { level: 1, name: product.name })).toBeVisible();
  if (product.itemsIncluded.length) {
    await expect(page.locator("details li").filter({ hasText: product.itemsIncluded[0]! })).toBeVisible();
  }
  await page.getByRole("button", { name: "Ampliar imagem de " + product.name }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Ampliar imagem de " + product.name })).toBeFocused();
  if (product.images.length > 1) {
    const next = page.getByRole("button", { name: "Ver imagem 2 de " + product.name });
    await next.click();
    await expect(next).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("link", { name: "Consultar este conjunto" }).click();
  await expect(page).toHaveURL(new RegExp("/contato\\?produto=" + product.slug));
  await expect(page.locator('select[name="collectionId"]')).toHaveValue(collection.id);
  expect(await page.locator('textarea[name="message"]').inputValue()).toContain(product.name);
});

test("consulta sem e-mail nem UTM mantém o produto e é aceita pela API", async ({ page, request }) => {
  const { product } = await firstProduct(request);
  await page.goto("/contato?produto=" + product.slug);
  await page.getByLabel("Nome *", { exact: true }).fill("Consulta E2E OSTON");
  await page.getByLabel("Telefone com DDD *", { exact: true }).fill("11999998877");
  const pending = page.waitForResponse((response) => response.url().includes("/v1/public/leads") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Enviar solicitação" }).click();
  const response = await pending;
  const body = response.request().postDataJSON();
  expect(body.utmSource).toBeUndefined();
  expect(body.email).toBe("");
  expect(body.collectionId).toBe(product.collectionId);
  expect(body.message).toContain(product.name);
  expect(body.landingPage).toBe("/produtos/" + product.slug);
  expect(response.status()).toBe(201);
  await expect(page.getByText("Mensagem recebida", { exact: true })).toBeVisible();
});

test("produto sob consulta não inventa preço ou avaliações em JSON-LD", async ({ page, request }) => {
  const { product } = await firstProduct(request);
  await page.goto("/produtos/" + product.slug);
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  if (product.isDemo || !product.price) {
    expect(schemas.some((schema) => schema.includes('"@type":"Offer"'))).toBeFalsy();
    await expect(page.getByText("Sob consulta", { exact: true })).toBeVisible();
  }
  expect(schemas.some((schema) => schema.includes("aggregateRating"))).toBeFalsy();
  expect(schemas.join(" ")).not.toContain("undefined");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toMatch(/^https?:\/\//);
  expect(canonical).toContain("/produtos/" + product.slug);
  if (product.isDemo) await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("falha no envio mantém os dados e permite tentar novamente", async ({ page }) => {
  await page.route("**/v1/public/leads", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"title":"Serviço indisponível"}' }));
  await page.goto("/contato");
  await page.getByLabel("Nome *", { exact: true }).fill("Nome preservado");
  await page.getByLabel("Telefone com DDD *", { exact: true }).fill("11999998877");
  await page.getByRole("button", { name: "Enviar solicitação" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Seus dados foram mantidos");
  await expect(page.getByLabel("Nome *", { exact: true })).toHaveValue("Nome preservado");
  await expect(page.getByRole("button", { name: "Enviar solicitação" })).toBeEnabled();
});

test("campanha mantém atribuição ao navegar pelo catálogo até a consulta", async ({ page, request }) => {
  const { product, collection } = await firstProduct(request);
  await page.route("**/v1/public/leads", (route) => route.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true}' }));
  await page.goto("/colecoes?utm_source=editorial&utm_medium=site&utm_campaign=colecao-2026");
  await page.locator('a[href="/colecoes/' + collection.slug + '"]').first().click();
  await page.locator('a[href="/produtos/' + product.slug + '"]').first().click();
  await page.getByRole("link", { name: "Consultar este conjunto" }).click();
  await page.getByLabel("Nome *", { exact: true }).fill("Consulta de campanha");
  await page.getByLabel("Telefone com DDD *", { exact: true }).fill("11999998877");
  const pending = page.waitForRequest((request) => request.url().includes("/v1/public/leads") && request.method() === "POST");
  await page.getByRole("button", { name: "Enviar solicitação" }).click();
  const body = (await pending).postDataJSON();
  expect(body).toMatchObject({
    utmSource: "editorial",
    utmMedium: "site",
    utmCampaign: "colecao-2026",
    landingPage: "/colecoes",
    source: "product-consultation",
  });
  expect(body.message).toContain(product.name);
});
