import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env.js", () => ({
  loadEnv: () => ({ webOrigins: ["https://oston.test"], REVALIDATION_SECRET: "private-revalidation-secret" }),
}));

import { revalidateSite } from "./revalidate.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("cache invalidation delivery", () => {
  it("records a rejected response without leaking secrets or undoing the saved edit", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("denied", { status: 401 }));
    vi.stubGlobal("fetch", fetch);
    const log = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(revalidateSite(["site", "products", "unauthorized-tag"])).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
    const serialized = String(log.mock.calls[0]?.[0]);
    expect(JSON.parse(serialized)).toMatchObject({
      event: "cache.revalidation.rejected", statusCode: 401, tags: ["site", "products"],
    });
    expect(serialized).not.toContain("private-revalidation-secret");
  });

  it("bounds a stuck revalidation request", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation((milliseconds) => {
      expect(milliseconds).toBe(5_000);
      return AbortSignal.abort(new DOMException("Timed out", "TimeoutError"));
    });
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      init.signal?.throwIfAborted();
      return new Response();
    }));
    const log = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(revalidateSite(["site"])).resolves.toBeUndefined();
    expect(timeout).toHaveBeenCalledOnce();
    expect(JSON.parse(String(log.mock.calls[0]?.[0])).event).toBe("cache.revalidation.failed");
  });
});
