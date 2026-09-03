import { expect, test } from "@playwright/test";

const api = process.env.API_URL ?? "http://localhost:4000";

test("homepage responde", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("h1")).toBeVisible();
});

test("coleções abre", async ({ page }) => {
  const response = await page.goto("/colecoes");
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator("h1")).toBeVisible();
});

test("collection detail abre", async ({ page }) => {
  const response = await page.goto("/colecoes/aurora");
  expect(response?.status()).toBeLessThan(500);
  if (response?.ok()) {
    await expect(page.locator("h1")).toBeVisible();
  }
});

test("contato abre", async ({ page }) => {
  const response = await page.goto("/contato");
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("h1")).toBeVisible();
});

test("lead inválido é rejeitado", async ({ page }) => {
  await page.goto("/contato");
  await page.locator('input[name="name"]').fill("A");
  await page.locator('input[name="phone"]').fill("1");
  await page.getByRole("button", { name: /enviar/i }).click();
  await expect(page.getByText(/não foi possível enviar/i)).toBeVisible({ timeout: 15_000 });
});

test("lead válido é enviado", async ({ request }) => {
  const response = await request.post(`${api}/v1/public/leads`, {
    data: {
      name: "Maria Silva",
      phone: "11999998888",
      interest: "CONSULTANT",
      source: "e2e",
    },
  });
  test.skip(response.status() >= 500, "Banco indisponível neste ambiente");
  expect(response.status()).toBe(201);
  await expect(response.json()).resolves.toMatchObject({ ok: true });
});

test("admin sem sessão vai para login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("login inválido é rejeitado", async ({ page }) => {
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill("nobody@ostoncookware.com");
  await page.locator('input[name="password"]').fill("senha-errada-123");
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page.getByText(/e-mail ou senha inválidos/i)).toBeVisible({ timeout: 15_000 });
});

test("endpoint admin sem auth retorna 401", async ({ request }) => {
  const response = await request.get(`${api}/v1/admin/campaigns`);
  expect(response.status()).toBe(401);
});

test("upload sem auth é rejeitado", async ({ request }) => {
  const response = await request.post(`${api}/v1/admin/media/upload`, {
    data: { type: "blob.generate-client-token" },
  });
  expect(response.status()).toBe(401);
});

test("preview admin sem sessão retorna 401", async ({ request }) => {
  const response = await request.get("/api/preview?type=home&path=/");
  expect(response.status()).toBe(401);
});
