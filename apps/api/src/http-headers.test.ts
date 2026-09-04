import { describe, expect, it } from "vitest";
import { headersFromInject, isHopByHopHeader } from "./http-headers.js";

describe("headersFromInject", () => {
  it("copia headers simples e ignora hop-by-hop", () => {
    const headers = headersFromInject({
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
      "Content-Length": "12",
    });

    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("transfer-encoding")).toBe(false);
    expect(headers.has("content-length")).toBe(false);
    expect(isHopByHopHeader("Connection")).toBe(true);
  });

  it("preserva vários Set-Cookie", () => {
    const headers = headersFromInject({
      "set-cookie": ["a=1; Path=/", "b=2; Path=/"],
    });

    expect(headers.getSetCookie()).toEqual(["a=1; Path=/", "b=2; Path=/"]);
  });
});
