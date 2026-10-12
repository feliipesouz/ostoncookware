import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma, type Prisma } from "@oston/database";
import { defaultBrandHeroSection } from "@oston/contracts";
import { getHomepage, updateHomepage } from "./service.js";

// The homepage is a singleton. Run only against the disposable integration database.
describe.skipIf(process.env.RUN_API_INTEGRATION !== "true")("homepage publication concurrency", () => {
  let original: Awaited<ReturnType<typeof prisma.homepage.findUnique>>;

  beforeEach(async () => {
    original = await prisma.homepage.findUnique({ where: { id: "default" } });
  });

  afterEach(async () => {
    if (original) {
      const data = { sections: original.sections as Prisma.InputJsonValue, version: original.version, updatedAt: original.updatedAt };
      await prisma.homepage.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
    } else {
      await prisma.homepage.deleteMany({ where: { id: "default" } });
    }
  });

  it("does not write to the database while rendering an uninitialized homepage", async () => {
    await prisma.homepage.deleteMany({ where: { id: "default" } });
    const result = await getHomepage();
    expect(result.sections[0]?.type).toBe("BRAND_HERO");
    expect(await prisma.homepage.count({ where: { id: "default" } })).toBe(0);
  });

  it.each(["existing", "uninitialized"])("accepts exactly one of two concurrent saves for an %s homepage", async (state) => {
    if (state === "uninitialized") {
      await prisma.homepage.deleteMany({ where: { id: "default" } });
    } else {
      await prisma.homepage.upsert({
        where: { id: "default" },
        create: { id: "default", sections: [defaultBrandHeroSection], version: 1 },
        update: { sections: [defaultBrandHeroSection], version: 1 },
      });
    }
    const outcomes = await Promise.allSettled([
      updateHomepage({ sections: [{ ...defaultBrandHeroSection, title: "Editor A" }], expectedVersion: 1 }),
      updateHomepage({ sections: [{ ...defaultBrandHeroSection, title: "Editor B" }], expectedVersion: 1 }),
    ]);
    const accepted = outcomes.filter((outcome) => outcome.status === "fulfilled");
    const rejected = outcomes.filter((outcome) => outcome.status === "rejected");
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatchObject({ status: 409, code: "VERSION_CONFLICT", meta: { currentVersion: 2 } });
    const stored = await getHomepage();
    expect(stored.version).toBe(2);
    expect(stored.sections).toEqual(accepted[0]?.value.sections);
  });

  it("persists slide order, hydrates both crops and rejects unknown slide media without publishing", async () => {
    const mediaIds: string[] = [];
    try {
      for (const suffix of ["desktop-a", "mobile-a", "desktop-b"]) {
        const media = await prisma.mediaAsset.create({ data: {
          url: `/catalogo/qa-carousel-${suffix}.webp`, pathname: `qa-carousel-${suffix}.webp`,
          originalFilename: `${suffix}.webp`, mimeType: "image/webp", size: 100, type: "IMAGE",
        } });
        mediaIds.push(media.id);
      }
      const before = await getHomepage();
      const slides = [
        { desktopImageId: mediaIds[2]!, imageAlt: "Segundo conjunto primeiro" },
        { desktopImageId: mediaIds[0]!, mobileImageId: mediaIds[1]!, imageAlt: "Primeiro conjunto depois" },
      ];
      await updateHomepage({ sections: [{ ...defaultBrandHeroSection, slides }], expectedVersion: before.version });
      const saved = await getHomepage();
      const hero = saved.sections.find((section) => section.type === "BRAND_HERO");
      expect(hero).toMatchObject({ slides: [
        { ...slides[0], desktopImage: { id: mediaIds[2] }, mobileImage: null },
        { ...slides[1], desktopImage: { id: mediaIds[0] }, mobileImage: { id: mediaIds[1] } },
      ] });
      await expect(updateHomepage({
        sections: [{ ...defaultBrandHeroSection, slides: [{ desktopImageId: "missing-carousel-image" }] }],
        expectedVersion: saved.version,
      })).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
      expect((await getHomepage()).version).toBe(saved.version);
    } finally {
      await prisma.mediaAsset.deleteMany({ where: { id: { in: mediaIds } } });
    }
  });

});
