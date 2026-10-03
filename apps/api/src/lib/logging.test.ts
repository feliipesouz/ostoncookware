import { afterEach, describe, expect, it, vi } from "vitest";
import { errorForLog, serverLog } from "./logging.js";
import { unavailableResponse } from "./runtime.js";

afterEach(() => vi.restoreAllMocks());

describe("safe runtime diagnostics", () => {
  it("keeps useful error codes without logging messages, causes or request data", () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = Object.assign(
      new Error("postgresql://user:database-password@private.example/db", {
        cause: new Error("token=private-token customer@example.com"),
      }),
      { code: "ECONNREFUSED" },
    );
    const context = {
      correlationId: "request-123",
      error,
      headers: { authorization: "Bearer private-token" },
      body: { email: "customer@example.com" },
      password: "private-password",
    };

    serverLog("error", "api.unavailable", context);

    const serialized = String(output.mock.calls[0]?.[0]);
    expect(JSON.parse(serialized)).toMatchObject({
      correlationId: "request-123",
      event: "api.unavailable",
      error: { type: "Error", code: "ECONNREFUSED" },
    });
    expect(serialized).not.toMatch(/database-password|private-token|customer@|private-password|postgresql/);
    expect(errorForLog({ password: "never-log-this" })).toEqual({ type: "UnknownError" });
  });

  it("returns a generic, uncacheable 503 linked to its server log", async () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = unavailableResponse(new Error("BETTER_AUTH_SECRET=private-secret"), "auth");
    const payload = await response.json() as { correlationId: string; code: string; status: number };

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-type")).toBe("application/problem+json");
    expect(payload).toMatchObject({ code: "SERVICE_UNAVAILABLE", status: 503 });
    expect(payload.correlationId).toBe(response.headers.get("x-request-id"));
    expect(JSON.parse(String(output.mock.calls[0]?.[0])).correlationId).toBe(payload.correlationId);
    expect(JSON.stringify(payload)).not.toMatch(/BETTER_AUTH|private-secret|stack|cause/);
  });
});
