import { describe, expect, it } from "vitest";
import { HttpError } from "../../../lib/errors.js";
import { applyVersionedUpdate, throwIfVersionConflict, versionConflictError } from "../../../lib/occ.js";

describe("product OCC", () => {
  it("two editors: A reads v1, B reads v1, A saves → v2, B saves v1 → 409", () => {
    const initial = {
      version: 1,
      deletedAt: null,
      updatedAt: new Date("2026-09-03T12:00:00.000Z"),
      updatedBy: { name: "Ana" },
    };

    const editorAExpected = initial.version;
    const editorBExpected = initial.version;

    const afterA = applyVersionedUpdate(initial, editorAExpected);
    expect(afterA.version).toBe(2);

    expect(() => applyVersionedUpdate(afterA, editorBExpected)).toThrow(HttpError);
    try {
      applyVersionedUpdate(afterA, editorBExpected);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      const conflict = error as HttpError;
      expect(conflict.status).toBe(409);
      expect(conflict.code).toBe("VERSION_CONFLICT");
      expect(conflict.message).toBe("Este conteúdo foi alterado por outra pessoa enquanto você editava.");
      expect(conflict.detail).toContain("Ana");
    }
  });

  it("updateMany count 0 with a newer version raises VERSION_CONFLICT", () => {
    expect(() =>
      throwIfVersionConflict(
        {
          version: 2,
          deletedAt: null,
          updatedAt: new Date(),
          updatedBy: { name: "Bruno" },
        },
        0,
      ),
    ).toThrow(/outra pessoa/);
  });

  it("includes last editor in the conflict detail", () => {
    const error = versionConflictError({
      version: 4,
      updatedAt: new Date("2026-09-03T15:00:00.000Z"),
      updatedBy: { name: "Carla" },
    });
    expect(error.detail).toContain("Carla");
    expect(error.meta?.currentVersion).toBe(4);
  });
});
