import { describe, expect, it } from "vitest";
import {
  isAllowlistedPreviewPath,
  isSafePreviewPath,
  previewPathFromParams,
  resolvePreviewAccess,
  resolvePreviewDisablePath,
  parseCampaignPreviewId,
} from "@oston/contracts";

describe("preview path security", () => {
  it("allows only bounded opaque campaign IDs", () => {
    expect(parseCampaignPreviewId("campaign-123_A")).toBe("campaign-123_A");
    for (const value of [null, undefined, "", "../draft", "draft?admin=true", "x".repeat(65)]) {
      expect(parseCampaignPreviewId(value)).toBeNull();
    }
  });
  it("rejects unauthenticated preview", () => {
    const result = resolvePreviewAccess(false, "/colecoes/aurora");
    expect(result).toEqual({ ok: false, status: 401, reason: "unauthenticated" });
  });

  it("blocks open redirects", () => {
    expect(isSafePreviewPath("//evil.com")).toBe(false);
    expect(isSafePreviewPath("\\evil.com")).toBe(false);
    expect(isSafePreviewPath("http://evil.com")).toBe(false);
    expect(isSafePreviewPath("https://evil.com")).toBe(false);
    expect(isSafePreviewPath("/\\evil.com")).toBe(false);
    expect(resolvePreviewAccess(true, "//evil.com").ok).toBe(false);
    expect(resolvePreviewAccess(true, "https://evil.com").status).toBe(403);
  });

  it("only allows the preview path allowlist", () => {
    expect(isAllowlistedPreviewPath("/")).toBe(true);
    expect(isAllowlistedPreviewPath("/colecoes")).toBe(true);
    expect(isAllowlistedPreviewPath("/colecoes/aurora")).toBe(true);
    expect(isAllowlistedPreviewPath("/produtos/frigideira-28")).toBe(true);
    expect(isAllowlistedPreviewPath("/a-marca")).toBe(true);
    expect(isAllowlistedPreviewPath("/contato")).toBe(true);
    expect(isAllowlistedPreviewPath("/admin")).toBe(false);
    expect(isAllowlistedPreviewPath("/api/preview")).toBe(false);
    expect(isAllowlistedPreviewPath("/colecoes/../admin")).toBe(false);
    expect(resolvePreviewAccess(true, "/admin").ok).toBe(false);
  });

  it("infers allowlisted paths from type and slug", () => {
    expect(previewPathFromParams({ type: "home" })).toBe("/");
    expect(previewPathFromParams({ type: "campaign" })).toBe("/");
    expect(previewPathFromParams({ type: "collection", slug: "aurora" })).toBe("/colecoes/aurora");
    expect(previewPathFromParams({ type: "product", slug: "frigideira-28" })).toBe("/produtos/frigideira-28");
    expect(previewPathFromParams({ type: "page", slug: "a-marca" })).toBe("/a-marca");
  });

  it("disable preview only returns to allowlisted paths", () => {
    expect(resolvePreviewDisablePath(null)).toBe("/");
    expect(resolvePreviewDisablePath("/colecoes")).toBe("/colecoes");
    expect(resolvePreviewDisablePath("//evil.com")).toBe("/");
    expect(resolvePreviewDisablePath("/admin")).toBe("/");
  });
});
