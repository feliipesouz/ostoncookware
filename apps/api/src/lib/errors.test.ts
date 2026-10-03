import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { HttpError, sendProblem } from "./errors.js";

const apps: ReturnType<typeof Fastify>[] = [];

function testApp() {
  const app = Fastify({ logger: false, bodyLimit: 64 });
  app.setErrorHandler((error, request, reply) => sendProblem(request, reply, error));
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  vi.restoreAllMocks();
});

describe("HTTP failure contract", () => {
  it("preserves field validation and rate-limit recovery information", async () => {
    const app = testApp();
    app.post("/validate", async (request) => z.object({ name: z.string().min(2) }).parse(request.body));
    app.get("/limited", async () => {
      throw new HttpError(429, "Aguarde e tente novamente.", {
        code: "RATE_LIMITED", meta: { retryAfterSeconds: 27 },
      });
    });

    const validation = await app.inject({ method: "POST", url: "/validate", payload: { name: "" } });
    expect(validation.statusCode).toBe(400);
    expect(validation.json().errors[0].path).toBe("name");
    const limited = await app.inject({ method: "GET", url: "/limited" });
    expect(limited.statusCode).toBe(429);
    expect(limited.headers["retry-after"]).toBe("27");
    expect(limited.json().code).toBe("RATE_LIMITED");
  });

  it("keeps body-limit and malformed JSON failures as 413/400", async () => {
    const app = testApp();
    app.post("/input", async () => ({ ok: true }));
    const oversized = await app.inject({
      method: "POST", url: "/input", payload: { message: "x".repeat(100) },
    });
    expect(oversized.statusCode).toBe(413);
    const malformed = await app.inject({
      method: "POST", url: "/input",
      headers: { "content-type": "application/json" }, payload: '{"password":"secret"',
    });
    expect(malformed.statusCode).toBe(400);
    expect(malformed.body).not.toContain("secret");
  });

  it("honors non-exposed errors and never returns internal details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = testApp();
    app.get("/internal", async () => {
      throw new HttpError(503, "private database password", {
        code: "UNAVAILABLE", detail: "SQL internal", meta: { token: "private-token" },
      });
    });
    const response = await app.inject({ method: "GET", url: "/internal" });
    expect(response.statusCode).toBe(503);
    expect(response.headers["cache-control"]).toContain("no-store");
    expect(response.json().correlationId).toBe(response.headers["x-request-id"]);
    expect(response.body).not.toMatch(/private|SQL|token/);
  });
});
