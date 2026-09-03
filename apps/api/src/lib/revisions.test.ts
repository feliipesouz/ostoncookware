import { describe, expect, it } from "vitest";
import { diffSummary, planRestore } from "./revisions.js";

describe("revisions", () => {
  it("create revision then restore creates a NEW version and keeps history", () => {
    const history = [{ version: 1, snapshot: { name: "Aurora" } }];
    const restored = planRestore(history, { name: "Aurora restaurada" });

    expect(restored.nextVersion).toBe(2);
    expect(restored.keepHistory).toBe(true);
    expect(restored.historyLength).toBe(2);
    expect(history).toHaveLength(1);
  });

  it("diffSummary lists changed field names", () => {
    expect(diffSummary({ name: "A", slug: "a" }, { name: "B", slug: "a" })).toEqual(["name"]);
  });
});
