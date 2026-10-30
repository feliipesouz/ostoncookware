import { describe, expect, it } from "vitest";
import { adminUserCreateSchema } from "@oston/contracts";

describe("CMS user creation contract", () => {
  const valid = { name: " Editor OSTON ", email: " EDITOR@EXAMPLE.COM ", password: "LongPassword123" };
  it("normalizes identity and defaults to the least privileged supported role", () => {
    expect(adminUserCreateSchema.parse(valid)).toMatchObject({ name: "Editor OSTON", email: "editor@example.com", role: "EDITOR" });
  });
  it("rejects owner creation and account-field injection", () => {
    expect(adminUserCreateSchema.safeParse({ ...valid, role: "OWNER" }).success).toBe(false);
    expect(adminUserCreateSchema.safeParse({ ...valid, emailVerified: true }).success).toBe(false);
  });
  it("enforces the same password bounds as authentication", () => {
    expect(adminUserCreateSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
    expect(adminUserCreateSchema.safeParse({ ...valid, password: "x".repeat(129) }).success).toBe(false);
    expect(adminUserCreateSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(true);
  });
});
