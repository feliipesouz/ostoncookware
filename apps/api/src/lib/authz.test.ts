import { describe, expect, it } from "vitest";
import { can } from "./authz.js";

describe("authz", () => {
  it("allows editors to write content but not settings", () => {
    expect(can("EDITOR", "content:write")).toBe(true);
    expect(can("EDITOR", "settings:write")).toBe(false);
  });

  it("restricts user management to owners", () => {
    expect(can("ADMIN", "users:write")).toBe(false);
    expect(can("OWNER", "users:write")).toBe(true);
  });

  it("keeps export, redirects and hard delete away from editors", () => {
    expect(can("EDITOR", "leads:export")).toBe(false);
    expect(can("EDITOR", "redirects:write")).toBe(false);
    expect(can("EDITOR", "content:delete")).toBe(false);
    expect(can("EDITOR", "system:read")).toBe(false);
    expect(can("ADMIN", "leads:export")).toBe(true);
    expect(can("ADMIN", "redirects:write")).toBe(true);
    expect(can("ADMIN", "content:delete")).toBe(true);
  });
});
