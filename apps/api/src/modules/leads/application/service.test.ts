import { describe, expect, it } from "vitest";
import { leadCreateSchema, leadNoteCreateSchema, leadUpdateSchema } from "@oston/contracts";
import { can } from "../../../lib/authz.js";
import {
  assignmentMessage,
  findDuplicateCandidates,
  noteAddedMessage,
  statusChangeMessage,
} from "./service.js";

describe("leadCreateSchema", () => {
  it("accepts a valid consultant lead", () => {
    const parsed = leadCreateSchema.parse({
      name: "Maria Silva",
      phone: "11999999999",
      interest: "CONSULTANT",
    });
    expect(parsed.name).toBe("Maria Silva");
  });

  it("rejects missing phone", () => {
    expect(() =>
      leadCreateSchema.parse({
        name: "Maria Silva",
      }),
    ).toThrow();
  });
});

describe("lead note authorization", () => {
  it("blocks public and editor from writing notes; admin can write", () => {
    expect(can("EDITOR", "leads:read")).toBe(true);
    expect(can("EDITOR", "leads:write")).toBe(false);
    expect(can("ADMIN", "leads:write")).toBe(true);
    expect(can("OWNER", "leads:write")).toBe(true);
  });

  it("rejects empty note content", () => {
    expect(() => leadNoteCreateSchema.parse({ content: "   " })).toThrow();
    expect(leadNoteCreateSchema.parse({ content: "Ligou e pediu catálogo." }).content).toBe(
      "Ligou e pediu catálogo.",
    );
  });
});

describe("lead assignment", () => {
  it("builds Portuguese assignment and status messages", () => {
    expect(assignmentMessage("Felipe Arruda", "Maria Souza")).toBe("Felipe atribuiu o lead a Maria Souza");
    expect(assignmentMessage("Felipe Arruda", null)).toBe("Felipe removeu o responsável");
    expect(statusChangeMessage("Felipe Arruda", "NEW", "CONTACTED")).toBe("Felipe alterou NEW → CONTACTED");
    expect(noteAddedMessage("Felipe Arruda")).toBe("Felipe adicionou uma nota");
  });

  it("accepts assignedToId and tags on admin patch only", () => {
    const parsed = leadUpdateSchema.parse({
      status: "CONTACTED",
      assignedToId: "user_1",
      tags: ["vip"],
    });
    expect(parsed.assignedToId).toBe("user_1");
    expect(() => leadUpdateSchema.parse({ notes: "hack" })).toThrow();
  });
});

describe("lead export authorization", () => {
  it("forbids EDITOR and allows OWNER/ADMIN", () => {
    expect(can("EDITOR", "leads:export")).toBe(false);
    expect(can("ADMIN", "leads:export")).toBe(true);
    expect(can("OWNER", "leads:export")).toBe(true);
    expect(can("EDITOR", "leads:read")).toBe(true);
  });
});

describe("duplicate detection", () => {
  it("finds other leads with the same normalized phone or email and never includes self", () => {
    const current = { id: "a", phoneNormalized: "11988887777", emailNormalized: "ana@oston.com" };
    const matches = findDuplicateCandidates(current, [
      { id: "a", name: "Ana", phone: "11988887777", email: "ana@oston.com", createdAt: new Date(), phoneNormalized: "11988887777", emailNormalized: "ana@oston.com" },
      { id: "b", name: "Ana 2", phone: "11988887777", email: null, createdAt: new Date(), phoneNormalized: "11988887777", emailNormalized: null },
      { id: "c", name: "Outra", phone: "11900000000", email: "other@oston.com", createdAt: new Date(), phoneNormalized: "11900000000", emailNormalized: "other@oston.com" },
      { id: "d", name: "Ana 3", phone: "110", email: "ANA@oston.com", createdAt: new Date(), phoneNormalized: "110", emailNormalized: "ana@oston.com" },
    ]);
    expect(matches.map((row) => row.id).sort()).toEqual(["b", "d"]);
  });

  it("does not match when normalized fields are missing", () => {
    expect(
      findDuplicateCandidates({ id: "a", phoneNormalized: null, emailNormalized: null }, [
        { id: "b", name: "X", phone: "1", email: null, createdAt: new Date(), phoneNormalized: "1", emailNormalized: null },
      ]),
    ).toEqual([]);
  });
});
