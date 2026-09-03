import { describe, expect, it } from "vitest";
import { HttpError } from "../../../lib/errors.js";
import { assertInTrash, collectionInUseError, restoreFromTrashData, softDeleteData } from "../../../lib/soft-delete.js";

describe("collection trash", () => {
  it("archive/soft-delete sets deletedAt and ARCHIVED", () => {
    const data = softDeleteData();
    expect(data.status).toBe("ARCHIVED");
    expect(data.featured).toBe(false);
    expect(data.deletedAt).toBeInstanceOf(Date);
  });

  it("restore clears deletedAt", () => {
    expect(restoreFromTrashData()).toEqual({ deletedAt: null });
  });

  it("blocks delete when products still exist, with a human message", () => {
    expect(() => collectionInUseError([{ name: "Conjunto Aurora (DEMO)" }, { name: "Conjunto Nox (DEMO)" }])).toThrow(
      HttpError,
    );
    try {
      collectionInUseError([{ name: "Conjunto Aurora (DEMO)" }]);
    } catch (error) {
      const conflict = error as HttpError;
      expect(conflict.status).toBe(409);
      expect(conflict.code).toBe("IN_USE");
      expect(conflict.message).toContain("Conjunto Aurora (DEMO)");
      expect(conflict.detail).toContain("Conjunto Aurora (DEMO)");
    }
  });

  it("hard delete is only allowed from trash", () => {
    expect(() => assertInTrash({ deletedAt: null })).toThrow(/lixeira/);
    expect(() => assertInTrash({ deletedAt: new Date() })).not.toThrow();
  });
});
