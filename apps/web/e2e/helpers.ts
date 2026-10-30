import { expect, test, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_ADMIN_EMAIL/PASSWORD não definidos");
  }

  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  const submit = async () => {
    const response = page.waitForResponse((response) =>
      response.url().includes("/sign-in/email") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /entrar/i }).click();
    return response;
  };
  let response = await submit();
  // The suite shares an IP. Respect the real login limiter instead of disabling it.
  if (response.status() === 429) {
    const seconds = Number(response.headers()["retry-after"] ?? 60);
    const waitMs = (Number.isFinite(seconds) ? Math.min(60, Math.max(1, seconds)) : 60) * 1000 + 1000;
    test.info().setTimeout(test.info().timeout + waitMs);
    await page.waitForTimeout(waitMs);
    response = await submit();
  }
  expect(response.ok(), `Login returned HTTP ${response.status()}`).toBeTruthy();
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20_000 });
  await expect(page).not.toHaveURL(/\/admin\/login/);
}
