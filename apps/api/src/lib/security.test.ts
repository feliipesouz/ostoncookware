import { describe, expect, it } from "vitest";
import type { FastifyRequest } from "fastify";
import { campaignWriteSchema, isSafeCtaUrl, leadCreateSchema, paginationQuerySchema } from "@oston/contracts";
import { can } from "./authz.js";
import { parseOrigins } from "../config/env.js";
import { assertBootstrapPassword } from "./password.js";
import { filterRevalidateTags } from "./revalidate.js";
import { PINO_REDACT_PATHS } from "./logging.js";
import { assertSafeBlobPath, assertUpload, isTrustedBlobUrl } from "../modules/media/application/upload-rules.js";
import { HttpError } from "./errors.js";
import { clientIp } from "./http.js";

describe("RBAC", () => {
  it("allows editors to write content but not settings, users or audit", () => {
    expect(can("EDITOR", "content:write")).toBe(true);
    expect(can("EDITOR", "settings:write")).toBe(false);
    expect(can("EDITOR", "users:read")).toBe(false);
    expect(can("EDITOR", "users:write")).toBe(false);
    expect(can("EDITOR", "audit:read")).toBe(false);
    expect(can("EDITOR", "leads:write")).toBe(false);
    expect(can("EDITOR", "leads:export")).toBe(false);
    expect(can("EDITOR", "system:read")).toBe(false);
  });

  it("allows admin to manage content and settings but not promote users", () => {
    expect(can("ADMIN", "content:write")).toBe(true);
    expect(can("ADMIN", "settings:write")).toBe(true);
    expect(can("ADMIN", "users:read")).toBe(true);
    expect(can("ADMIN", "users:write")).toBe(false);
    expect(can("ADMIN", "leads:write")).toBe(true);
  });

  it("gives owner full access", () => {
    expect(can("OWNER", "users:write")).toBe(true);
    expect(can("OWNER", "audit:read")).toBe(true);
  });
});

describe("CTA / open redirect", () => {
  it("rejects javascript, data and protocol-relative URLs", () => {
    expect(isSafeCtaUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeCtaUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeCtaUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeCtaUrl("//evil.com")).toBe(false);
  });

  it("accepts internal paths and http(s)", () => {
    expect(isSafeCtaUrl("/colecoes")).toBe(true);
    expect(isSafeCtaUrl("https://wa.me/5511999999999")).toBe(true);
    expect(isSafeCtaUrl("http://localhost:3000/contato")).toBe(true);
  });

  it("rejects malicious CTA in campaign schema", () => {
    expect(() =>
      campaignWriteSchema.parse({
        name: "Hero",
        title: "Headline",
        desktopImageId: "img1",
        mobileImageId: "img2",
        imageAlt: "alt",
        primaryCtaLabel: "Go",
        primaryCtaUrl: "javascript:alert(1)",
      }),
    ).toThrow();
  });
});

describe("leads", () => {
  it("rejects mass assignment of status and notes", () => {
    expect(() =>
      leadCreateSchema.parse({
        name: "Maria Silva",
        phone: "11999999999",
        status: "WON",
        notes: "hack",
        createdBy: "attacker",
      }),
    ).toThrow();
  });

  it("accepts honeypot website without treating it as admin field", () => {
    const parsed = leadCreateSchema.parse({
      name: "Bot",
      phone: "11999999999",
      website: "https://spam.test",
    });
    expect(parsed.website).toBe("https://spam.test");
    expect("status" in parsed).toBe(false);
  });

  it("rejects oversized message", () => {
    expect(() =>
      leadCreateSchema.parse({
        name: "Maria Silva",
        phone: "11999999999",
        message: "x".repeat(2001),
      }),
    ).toThrow();
  });
});

describe("pagination", () => {
  it("rejects oversized pageSize instead of fetching everything", () => {
    expect(() => paginationQuerySchema.parse({ pageSize: "1000000" })).toThrow();
    expect(paginationQuerySchema.parse({}).page).toBe(1);
    expect(paginationQuerySchema.parse({}).pageSize).toBe(20);
  });
});

describe("upload rules", () => {
  it("rejects svg and unknown mime", () => {
    expect(() => assertUpload({ mimeType: "image/svg+xml", size: 100, type: "IMAGE" })).toThrow(HttpError);
    expect(() => assertUpload({ mimeType: "application/x-msdownload", size: 100, type: "IMAGE" })).toThrow(
      HttpError,
    );
  });

  it("rejects path traversal", () => {
    expect(() => assertSafeBlobPath("../etc/passwd")).toThrow(HttpError);
    expect(() => assertSafeBlobPath("/oston/media/a.jpg")).toThrow(HttpError);
    expect(() => assertSafeBlobPath("oston/media/ok.jpg")).not.toThrow();
  });

  it("only trusts vercel blob hosts", () => {
    expect(isTrustedBlobUrl("https://abc.public.blob.vercel-storage.com/file.jpg")).toBe(true);
    expect(isTrustedBlobUrl("https://evil.com/oston/media/x.jpg")).toBe(false);
    expect(isTrustedBlobUrl("http://abc.public.blob.vercel-storage.com/file.jpg")).toBe(false);
  });
});

describe("origins", () => {
  it("parses exact origins and rejects substring tricks", () => {
    const origins = parseOrigins("https://ostoncookware.com, https://www.ostoncookware.com");
    expect(origins).toEqual(["https://ostoncookware.com", "https://www.ostoncookware.com"]);
    expect(origins.includes("https://eviloston.com")).toBe(false);
  });

  it("rejects invalid origin values", () => {
    expect(() => parseOrigins("oston.com")).toThrow();
    expect(() => parseOrigins("javascript:alert(1)")).toThrow();
  });
});

describe("client identity", () => {
  it("uses Fastify's trusted address instead of unverified forwarding headers", () => {
    const request = {
      ip: "198.51.100.42",
      headers: {
        "x-real-ip": "203.0.113.1",
        "x-vercel-forwarded-for": "203.0.113.2",
        "x-forwarded-for": "203.0.113.3",
      },
    } as unknown as FastifyRequest;
    expect(clientIp(request)).toBe("198.51.100.42");
  });
});

describe("revalidation allowlist", () => {
  it("drops arbitrary tags", () => {
    expect(filterRevalidateTags(["site", "../admin", "campaigns", "users"])).toEqual(["site", "campaigns"]);
  });
});

describe("bootstrap password", () => {
  it("requires length and complexity without echoing the secret", () => {
    expect(() => assertBootstrapPassword("short")).toThrow(/ADMIN_PASSWORD/);
    expect(() => assertBootstrapPassword("onlyletters")).toThrow(/ADMIN_PASSWORD/);
    expect(() => assertBootstrapPassword("ValidPass123")).not.toThrow();
  });
});

describe("log redaction", () => {
  it("redacts cookies, tokens and database urls", () => {
    expect(PINO_REDACT_PATHS).toContain("req.headers.cookie");
    expect(PINO_REDACT_PATHS).toContain("req.headers.authorization");
    expect(PINO_REDACT_PATHS).toContain("*.password");
    expect(PINO_REDACT_PATHS).toContain("*.BLOB_READ_WRITE_TOKEN");
    expect(PINO_REDACT_PATHS).toContain("*.DATABASE_URL");
  });
});
