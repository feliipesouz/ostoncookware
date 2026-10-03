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
});
