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
