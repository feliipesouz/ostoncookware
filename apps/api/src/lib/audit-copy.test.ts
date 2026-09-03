import { describe, expect, it } from "vitest";
import { humanAuditMessage } from "./audit-copy.js";

describe("humanAuditMessage", () => {
  it("writes Portuguese publish copy", () => {
    expect(
      humanAuditMessage({
        action: "PUBLISH",
        entity: "collection",
        actorName: "Rodrigo Lima",
        metadata: { name: "Coleção Imperial" },
      }),
    ).toBe("Rodrigo publicou Coleção Imperial");
  });

  it("covers export, import, role change and restore", () => {
    expect(humanAuditMessage({ action: "EXPORT", entity: "lead", actorName: "Felipe" })).toBe("Felipe exportou lead");
    expect(humanAuditMessage({ action: "IMPORT", entity: "product", actorName: "Felipe" })).toBe("Felipe importou produto");
    expect(
      humanAuditMessage({
        action: "ROLE_CHANGE",
        entity: "user",
        actorName: "Felipe",
        metadata: { name: "Ana", to: "ADMIN" },
      }),
    ).toBe("Felipe alterou o papel de Ana para ADMIN");
    expect(
      humanAuditMessage({
        action: "RESTORE",
        entity: "product",
        actorName: "Felipe",
        metadata: { name: "Panela" },
      }),
    ).toBe("Felipe restaurou Panela");
  });
});
