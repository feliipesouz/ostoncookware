import { expect, test } from "@playwright/test";
import { imageSource } from "../src/lib/media";

const site = "https://oston.example";

test("bundled same-origin images remain local without widening remote image access", () => {
  expect(imageSource(`${site}/catalogo/oston.webp`, site)).toBe("/catalogo/oston.webp");
  expect(imageSource(`${site}/editorial/story.webp?v=2`, site)).toBe("/editorial/story.webp?v=2");
  expect(imageSource("http://localhost:3100/catalogo/oston.webp", "http://localhost:3100")).toBe(
    "/catalogo/oston.webp",
  );
});

test("remote media, different ports, and non-asset routes keep their original URL", () => {
  const sources = [
    "https://asset.public.blob.vercel-storage.com/catalogo/oston.webp",
    "https://oston.example.attacker.test/catalogo/oston.webp",
    `${site}:8443/catalogo/oston.webp`,
    `${site}/v1/media/oston.webp`,
    `${site}/catalogo/../private/oston.webp`,
  ];
  for (const source of sources) expect(imageSource(source, site)).toBe(source);
});

test("relative sources and absent or invalid site configuration are preserved", () => {
  expect(imageSource("/catalogo/oston.webp", site)).toBe("/catalogo/oston.webp");
  expect(imageSource(`${site}/catalogo/oston.webp`, "")).toBe(`${site}/catalogo/oston.webp`);
  expect(imageSource(`${site}/catalogo/oston.webp`, "not-a-url")).toBe(
    `${site}/catalogo/oston.webp`,
  );
});
