import { expect, test } from "@playwright/test";

test("public diagnostics are closed and liveness stays generic", async ({ request }) => {
  const diagnostic = await request.get("/api/diag");
  expect(diagnostic.status()).toBe(404);
  const health = await request.get("/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: "ok" });
  expect(health.headers()["cache-control"]).toContain("no-store");
});

test("CMS CSP allows the installed Blob endpoint without permitting every origin", async ({ request }) => {
  const response = await request.get("/admin/login");
  const csp = response.headers()["content-security-policy"] ?? "";
  const connect = csp.split(";").find((directive) => directive.trim().startsWith("connect-src")) ?? "";
  expect(connect).toContain("https://vercel.com/api/blob/");
  expect(connect.trim().split(/\s+/)).not.toContain("https:");
  expect(connect.trim().split(/\s+/)).not.toContain("*");
});

for (const route of ["/", "/a-marca", "/colecoes", "/contato"]) {
  test(`public content stays readable with reduced motion and clean link icons: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/[↗↘↖↙→←↑↓]/);

    // Check rendered readability, including sections below the fold, rather than
    // depending on animation timing or a particular transition implementation.
    const unreadable = await page.locator("main h1, main h2, footer a").evaluateAll((elements) =>
      elements.filter((element) => {
        for (let current: Element | null = element; current; current = current.parentElement) {
          const style = getComputedStyle(current);
          if (Number(style.opacity) === 0 || style.visibility === "hidden" || style.display === "none") return true;
        }
        return false;
      }).map((element) => element.textContent),
    );
    expect(unreadable).toEqual([]);
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
}

test("homepage editorial content remains available without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const headings = page.locator("main h2");
    expect(await headings.count()).toBeGreaterThan(0);
    for (const heading of await headings.all()) {
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
      await expect(heading).toHaveCSS("opacity", "1");
    }
  } finally {
    await context.close();
  }
});
