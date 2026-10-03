import { afterAll, describe, expect, it } from "vitest";

const enabled = process.env.RUN_API_INTEGRATION === "true";

describe.skipIf(!enabled)("API authorization", () => {
  let app: Awaited<ReturnType<typeof import("./app.js").buildApp>>;

  it("returns 401 without a session on admin endpoints", async () => {
    const { buildApp } = await import("./app.js");
    app = await buildApp();
    await app.ready();

    const campaigns = await app.inject({ method: "GET", url: "/v1/admin/campaigns" });
    expect(campaigns.statusCode).toBe(401);

    const upload = await app.inject({
      method: "POST",
      url: "/v1/admin/media/upload",
      payload: { type: "blob.generate-client-token" },
    });
    expect(upload.statusCode).toBe(401);

    const users = await app.inject({
      method: "PATCH",
      url: "/v1/admin/users/someone",
      payload: { role: "OWNER" },
    });
    expect(users.statusCode).toBe(401);

    const notes = await app.inject({
      method: "POST",
      url: "/v1/admin/leads/lead_1/notes",
      payload: { content: "nota pública" },
    });
    expect(notes.statusCode).toBe(401);

    const exportLeads = await app.inject({
      method: "GET",
      url: "/v1/admin/leads/export",
    });
    expect(exportLeads.statusCode).toBe(401);

    const system = await app.inject({
      method: "GET",
      url: "/v1/admin/system",
    });
    expect(system.statusCode).toBe(401);

    for (const url of [
      "/v1/admin/preview/campaigns/campaign_1",
      "/v1/admin/preview/site?campaignId=campaign_1",
    ]) {
      const preview = await app.inject({ method: "GET", url });
      expect(preview.statusCode).toBe(401);
    }
  });

  it("keeps liveness generic and does not reflect a client request id", async () => {
    const { buildApp } = await import("./app.js");
    app ??= await buildApp();
    const response = await app.inject({
      method: "GET", url: "/health", headers: { "x-request-id": "untrusted-client-id" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    expect(response.headers["cache-control"]).toContain("no-store");
    expect(response.headers["x-request-id"]).toMatch(/^[a-f0-9-]{36}$/);
    expect(response.headers["x-request-id"]).not.toBe("untrusted-client-id");
  });

  it("rejects public lead mass assignment and accepts a valid lead", async () => {
    const { buildApp } = await import("./app.js");
    app ??= await buildApp();
    await app.ready();

    const mass = await app.inject({
      method: "POST",
      url: "/v1/public/leads",
      payload: {
        name: "Ataque",
        phone: "11988887777",
        status: "WON",
        notes: "nope",
      },
    });
    expect(mass.statusCode).toBe(400);

    const xss = await app.inject({
      method: "POST",
      url: "/v1/public/leads",
      payload: {
        name: "<img src=x onerror=alert(1)>",
        phone: "11988887777",
        message: "<script>alert(1)</script>",
      },
    });
    expect([201, 400]).toContain(xss.statusCode);
    if (xss.statusCode === 201) {
      const body = xss.json() as { ok?: boolean };
      expect(body.ok).toBe(true);
    }

    const honeypot = await app.inject({
      method: "POST",
      url: "/v1/public/leads",
      payload: {
        name: "Bot",
        phone: "11988887777",
        website: "https://spam.test",
      },
    });
    expect(honeypot.statusCode).toBe(201);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
