import { describe, expect, it } from "vitest";
import { mediaInUseMessage } from "./service.js";

describe("mediaInUseMessage", () => {
  it("names the products still using the image", () => {
    expect(
      mediaInUseMessage([
        { type: "product", id: "1", name: "Panela", href: "/admin/produtos/1" },
        { type: "product", id: "2", name: "Frigideira", href: "/admin/produtos/2" },
        { type: "product", id: "3", name: "Wok", href: "/admin/produtos/3" },
      ]),
    ).toBe("Essa imagem ainda está sendo usada em 3 produtos (Panela, Frigideira, Wok).");
  });
});
