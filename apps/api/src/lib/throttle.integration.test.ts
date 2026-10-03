import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@oston/database";
import { consumeThrottle } from "./throttle.js";

// Run against the isolated PostgreSQL 16 service in CI, never production.
const enabled = process.env.RUN_API_INTEGRATION === "true";

describe.skipIf(!enabled)("persistent throttle concurrency", () => {
  const keys: string[] = [];

  function identity() {
    const value = `integration-${randomUUID()}`;
    keys.push(`lead:ip:${value}`);
    return value;
  }

  afterEach(async () => {
    await prisma.throttle.deleteMany({ where: { key: { in: keys.splice(0) } } });
  });

  it("admits exactly six competing requests and isolates different identities", async () => {
    const sharedIdentity = identity();
    const outcomes = await Promise.allSettled(
      Array.from({ length: 18 }, () => consumeThrottle("lead:ip", sharedIdentity)),
    );
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(6);
    const rejected = outcomes.filter((result) => result.status === "rejected");
    expect(rejected).toHaveLength(12);
    for (const result of rejected) {
      if (result.status === "rejected") {
        expect(result.reason).toMatchObject({ status: 429, code: "RATE_LIMITED" });
        expect(result.reason.meta.retryAfterSeconds).toBeGreaterThan(0);
      }
    }
    const counter = await prisma.throttle.findUnique({ where: { key: `lead:ip:${sharedIdentity}` } });
    expect(counter?.count).toBe(6);
    await expect(consumeThrottle("lead:ip", identity())).resolves.toBeUndefined();
  });

  it("opens only one new window when an expired counter receives concurrent requests", async () => {
    const sharedIdentity = identity();
    await prisma.throttle.create({
      data: {
        key: `lead:ip:${sharedIdentity}`, count: 6,
        windowStart: new Date(Date.now() - 700_000),
        expiresAt: new Date(Date.now() - 100_000),
      },
    });
    const outcomes = await Promise.allSettled(
      Array.from({ length: 12 }, () => consumeThrottle("lead:ip", sharedIdentity)),
    );
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(6);
    expect(outcomes.filter((result) => result.status === "rejected")).toHaveLength(6);
    const counter = await prisma.throttle.findUnique({ where: { key: `lead:ip:${sharedIdentity}` } });
    expect(counter?.count).toBe(6);
    expect(counter?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
