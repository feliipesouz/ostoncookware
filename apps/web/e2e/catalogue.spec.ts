import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

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
    if (data.products.length > 0) return { product: data.products[0] as Product, collection, productCount: data.products.length as number };
  }
  throw new Error("O catálogo de teste deve conter ao menos um produto publicado.");
}

async function consultantDestination(page: Page, request: APIRequestContext) {
  const response = await request.get("/v1/public/site");
  expect(response.ok()).toBeTruthy();
  const { data } = await response.json();
  const configured = (data.settings.whatsapp ?? "").replace(/\D/g, "");
  const expectedPhone = /^\d{10,15}$/.test(configured) ? configured : "5511994520877";
  const link = page.getByRole("main").getByRole("link", { name: "Falar com consultor", exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  const destination = new URL((await link.getAttribute("href"))!);
  expect(destination.origin).toBe("https://wa.me");
  expect(destination.pathname).toBe("/" + expectedPhone);
  expect(destination.searchParams.get("text")).toBeTruthy();
  return destination;
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
  const { product } = await firstProduct(request);
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
  const destination = await consultantDestination(page, request);
  expect(destination.searchParams.get("text")).toContain(product.name);
  expect(destination.searchParams.get("text")).toContain("/produtos/" + product.slug);
  await expect(page.getByRole("main").locator('a[href^="/contato"]')).toHaveCount(0);
});

test("link antigo de consulta mantém o produto sem exigir formulário", async ({ page, request }) => {
  const { product } = await firstProduct(request);
  await page.goto("/contato?produto=" + product.slug);
  await expect(page.getByRole("main").locator("form")).toHaveCount(0);
  const destination = await consultantDestination(page, request);
  expect(destination.searchParams.get("text")).toContain(product.name);
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

test("atendimento geral abre o WhatsApp sem formulário ou contexto inventado", async ({ page, request }) => {
  await page.goto("/contato?produto=produto-inexistente-e2e");
  await expect(page.getByRole("main").locator("form")).toHaveCount(0);
  const destination = await consultantDestination(page, request);
  expect(destination.searchParams.get("text")).not.toContain("produto-inexistente-e2e");
});

test("coleção com um conjunto leva direto aos detalhes e ao consultor", async ({ page, request }) => {
  const { product, collection, productCount } = await firstProduct(request);
  expect(productCount, "O seed deve conter uma coleção com um único conjunto").toBe(1);
  await page.goto("/colecoes?utm_source=editorial&utm_medium=site&utm_campaign=colecao-2026");
  await page.locator('a[href="/colecoes/' + collection.slug + '"]').first().click();
  await expect(page).toHaveURL((url) => url.pathname === "/produtos/" + product.slug);
  await expect(page.getByRole("heading", { level: 1, name: product.name })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explorar o conjunto", exact: true })).toHaveCount(0);
  await expect(page.getByRole("main").locator('nav a[href="/colecoes/' + collection.slug + '"]')).toHaveCount(0);
  const destination = await consultantDestination(page, request);
  expect(destination.searchParams.get("text")).toContain(product.name);
});

test("coleção sem produto mantém sua página editorial", async ({ page, request }) => {
  for (const collection of await catalogCollections(request)) {
    const response = await request.get("/v1/public/collections/" + collection.slug);
    expect(response.ok()).toBeTruthy();
    const { data } = await response.json();
    if (data.products.length !== 0) continue;
    await page.goto("/colecoes/" + collection.slug);
    await expect(page).toHaveURL((url) => url.pathname === "/colecoes/" + collection.slug);
    await expect(page.getByRole("heading", { level: 1, name: collection.name })).toBeVisible();
    return;
  }
  throw new Error("O seed deve conter uma coleção sem produtos para validar a página editorial.");
});
