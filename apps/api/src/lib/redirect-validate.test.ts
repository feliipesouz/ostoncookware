import { describe, expect, it } from "vitest";
import { HttpError } from "./errors.js";
import { publicCollectionPath, publicProductPath } from "./slug-redirect.js";
import { normalizeRedirectPath, validateRedirect, wouldCreateLoop } from "./redirect-validate.js";

describe("redirect-validate", () => {
  it("builds a 301 path conceptually when a published slug changes", () => {
    const parsed = validateRedirect({
      sourcePath: publicCollectionPath("aurora"),
      destination: publicCollectionPath("aurora-oficial"),
    });
    expect(parsed.sourcePath).toBe("/colecoes/aurora");
    expect(parsed.destination).toBe("/colecoes/aurora-oficial");
    expect(publicProductPath("nox-conjunto")).toBe("/produtos/nox-conjunto");
  });

  it("rejects A↔B loops", () => {
    expect(
      wouldCreateLoop("/colecoes/a", "/colecoes/b", [{ sourcePath: "/colecoes/b", destination: "/colecoes/a", active: true }]),
    ).toBe(true);
    expect(() =>
      validateRedirect({
        sourcePath: "/colecoes/a",
        destination: "/colecoes/b",
        existing: [{ sourcePath: "/colecoes/b", destination: "/colecoes/a", active: true }],
      }),
    ).toThrow(HttpError);
  });

  it("rejects javascript: destinations", () => {
    expect(() => validateRedirect({ sourcePath: "/antiga", destination: "javascript:alert(1)" })).toThrow(
      /inválida/,
    );
  });

  it("rejects source === dest", () => {
    expect(() => validateRedirect({ sourcePath: "/colecoes/aurora", destination: "/colecoes/aurora" })).toThrow(
      /iguais/,
    );
  });

  it("rejects protocol-relative and admin/api prefixes", () => {
    expect(() => normalizeRedirectPath("//evil.example", "source")).toThrow(/protocol-relative/);
    expect(() => normalizeRedirectPath("/admin/leads", "source")).toThrow(/administrativos/);
    expect(() => normalizeRedirectPath("/v1/public/site", "destination")).toThrow(/API/);
  });
});
