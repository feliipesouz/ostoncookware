import { describe, expect, it, vi } from "vitest";
import {
  defaultBrandHeroSection,
  defaultHomepageSections,
  defaultPurchaseGuideSection,
  defaultSetCompositionSection,
  homepageMediaIds,
  homepageSectionsSchema,
  homepageWriteSchema,
  withInstitutionalHero,
  withShoppingSections,
  type HomepageSection,
} from "@oston/contracts";
import { seasonalCampaignSlot, withCampaignPreviewSlot } from "./service.js";

// Section contracts and normalization do not need a database connection.
vi.mock("@oston/database", () => ({ prisma: {} }));

describe("independent homepage editorial slots", () => {
  it("preserves legacy configuration and its pinned campaign while adding the brand", () => {
    const legacy: HomepageSection[] = [
      { id: "brand-hero", type: "HERO", enabled: true, campaignId: "mothers-day" },
    ];
    const upgraded = withInstitutionalHero(legacy);
    expect(upgraded).toHaveLength(2);
    expect(upgraded[0]).toMatchObject({ id: "brand-hero-2", type: "BRAND_HERO" });
    expect(upgraded[1]).toBe(legacy[0]);
    expect(seasonalCampaignSlot(upgraded)).toEqual({ enabled: true, campaignId: "mothers-day" });
    expect(withInstitutionalHero(upgraded)).toBe(upgraded);
  });

  it("does not confuse an institutional hero with an enabled seasonal slot", () => {
    expect(seasonalCampaignSlot([defaultBrandHeroSection])).toEqual({
      enabled: false,
      campaignId: null,
    });
    expect(
      seasonalCampaignSlot([
        { id: "seasonal", type: "SEASONAL_CAMPAIGN", enabled: false, campaignId: "campaign" },
      ]),
    ).toEqual({ enabled: false, campaignId: null });
  });

  it("temporarily reveals a disabled campaign slot for preview without mutating publication", () => {
    const sections: HomepageSection[] = [
      defaultBrandHeroSection,
      { id: "seasonal", type: "SEASONAL_CAMPAIGN", enabled: false },
    ];
    const preview = withCampaignPreviewSlot(sections);
    expect(seasonalCampaignSlot(preview).enabled).toBe(true);
    expect(sections[1]?.enabled).toBe(false);
    expect(withCampaignPreviewSlot([defaultBrandHeroSection])[1]?.type).toBe("SEASONAL_CAMPAIGN");
  });

  it("rejects ambiguous identities, duplicate heroes, incomplete CTAs and missing edit versions", () => {
    expect(homepageSectionsSchema.safeParse(defaultHomepageSections).success).toBe(true);
    expect(
      homepageWriteSchema.safeParse({
        sections: [defaultBrandHeroSection, { ...defaultBrandHeroSection, id: "second" }],
        expectedVersion: 1,
      }).success,
    ).toBe(false);
    expect(
      homepageWriteSchema.safeParse({
        sections: [{ ...defaultBrandHeroSection, secondaryCtaUrl: undefined }],
        expectedVersion: 1,
      }).success,
    ).toBe(false);
    expect(homepageWriteSchema.safeParse({ sections: defaultHomepageSections }).success).toBe(
      false,
    );
  });

  it("preserves legacy reads but prevents publishing duplicate active campaign slots", () => {
    const sections = [
      { id: "legacy", type: "HERO", enabled: true, campaignId: "campaign" },
      { id: "seasonal", type: "SEASONAL_CAMPAIGN", enabled: true },
    ];
    expect(homepageSectionsSchema.safeParse(sections).success).toBe(true);
    expect(homepageWriteSchema.safeParse({ sections, expectedVersion: 1 }).success).toBe(false);
    expect(
      homepageWriteSchema.safeParse({
        sections: sections.map((section, index) => ({ ...section, enabled: index === 0 })),
        expectedVersion: 1,
      }).success,
    ).toBe(true);
  });

  it("tracks both hero crops and editorial images as media references", () => {
    expect(
      homepageMediaIds([
        { ...defaultBrandHeroSection, desktopImageId: "hero", mobileImageId: "hero-mobile" },
        { id: "story", type: "EDITORIAL_FEATURE", enabled: true, imageId: "hero" },
      ]),
    ).toEqual(["hero", "hero-mobile"]);
  });
});

describe("editable homepage shopping sections", () => {
  it("adds missing sections in context only when explicitly requested, preserving legacy content", () => {
    const legacy: HomepageSection[] = defaultHomepageSections
      .filter((section) => section.type !== "SET_COMPOSITION" && section.type !== "PURCHASE_GUIDE")
      .map((section) =>
        section.type === "manifesto"
          ? { ...section, id: "set-composition", quote: "Texto já publicado" }
          : section,
      );
    const upgraded = withShoppingSections(legacy);
    const compositionIndex = upgraded.findIndex((section) => section.type === "SET_COMPOSITION");
    const guideIndex = upgraded.findIndex((section) => section.type === "PURCHASE_GUIDE");

    expect(upgraded[compositionIndex - 1]?.type).toBe("featured_collections");
    expect(upgraded[compositionIndex]?.id).toBe("set-composition-2");
    expect(upgraded[guideIndex + 1]?.type).toBe("commercial_cta");
    expect(
      upgraded.filter(
        (section) => section.type !== "SET_COMPOSITION" && section.type !== "PURCHASE_GUIDE",
      ),
    ).toEqual(legacy);
    expect(legacy.some((section) => section.type === "SET_COMPOSITION")).toBe(false);
    expect(homepageWriteSchema.safeParse({ sections: upgraded, expectedVersion: 1 }).success).toBe(
      true,
    );
    expect(withShoppingSections(upgraded)).toBe(upgraded);
  });

  it("keeps edited and disabled shopping sections and supports adding one section at a time", () => {
    const edited = { ...defaultSetCompositionSection, enabled: false, title: "Composição editada" };
    const sections: HomepageSection[] = [defaultBrandHeroSection, edited];
    expect(withShoppingSections(sections, ["SET_COMPOSITION"])).toBe(sections);

    const upgraded = withShoppingSections(sections, ["PURCHASE_GUIDE"]);
    expect(upgraded[1]).toBe(edited);
    expect(upgraded[2]?.type).toBe("PURCHASE_GUIDE");
    expect(upgraded.filter((section) => section.type === "SET_COMPOSITION")).toHaveLength(1);
    expect(defaultSetCompositionSection.enabled).toBe(true);
  });

  it("keeps removed sections absent after parsing and the existing read normalization", () => {
    const removed = defaultHomepageSections.filter(
      (section) => section.type !== "SET_COMPOSITION" && section.type !== "PURCHASE_GUIDE",
    );
    const saved = homepageWriteSchema.parse({ sections: removed, expectedVersion: 2 });
    const read = withInstitutionalHero(homepageSectionsSchema.parse(saved.sections));
    expect(
      read.some(
        (section) => section.type === "SET_COMPOSITION" || section.type === "PURCHASE_GUIDE",
      ),
    ).toBe(false);
  });

  it("requires complete shopping content, three guide steps and safe destinations", () => {
    const publish = (section: HomepageSection) =>
      homepageWriteSchema.safeParse({ sections: [section], expectedVersion: 1 });
    expect(publish(defaultSetCompositionSection).success).toBe(true);
    expect(publish(defaultPurchaseGuideSection).success).toBe(true);
    expect(publish({ ...defaultSetCompositionSection, pieces: [] }).success).toBe(false);
    expect(
      publish({ ...defaultSetCompositionSection, ctaHref: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(
      publish({
        ...defaultPurchaseGuideSection,
        steps: defaultPurchaseGuideSection.steps.slice(0, 2),
      }).success,
    ).toBe(false);
    expect(
      publish({ ...defaultPurchaseGuideSection, faqs: [{ question: "Pergunta", answer: " " }] })
        .success,
    ).toBe(false);
    expect(publish({ ...defaultPurchaseGuideSection, ctaHref: "//example.com" }).success).toBe(
      false,
    );
  });

  it("rejects duplicate piece identities used by the interactive selector", () => {
    const firstPiece = defaultSetCompositionSection.pieces[0]!;
    const result = homepageWriteSchema.safeParse({
      sections: [
        {
          ...defaultSetCompositionSection,
          pieces: [firstPiece, { ...firstPiece, name: "Outra peça" }],
        },
      ],
      expectedVersion: 1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["sections", 0, "pieces", 1, "id"],
          message: "Cada peça deve ter um identificador único.",
        }),
      );
    }
  });

  it("tracks the composition image with all other homepage media", () => {
    expect(
      homepageMediaIds([
        { ...defaultBrandHeroSection, desktopImageId: "hero" },
        { ...defaultSetCompositionSection, imageId: "composition" },
        { id: "story", type: "EDITORIAL_FEATURE", enabled: true, imageId: "composition" },
        defaultPurchaseGuideSection,
      ]),
    ).toEqual(["hero", "composition"]);
  });

  it("does not create a configuration beyond the homepage section limit", () => {
    const sections: HomepageSection[] = Array.from({ length: 20 }, (_, index) => ({
      id: `editorial-${index}`,
      type: "EDITORIAL_FEATURE",
      enabled: true,
    }));
    expect(() => withShoppingSections(sections)).toThrow("A homepage pode ter até 20 seções.");
  });

  it("keeps legacy hero images valid and collects deduplicated carousel media in order", () => {
    const hero = {
      ...defaultBrandHeroSection,
      desktopImageId: "legacy",
      slides: [
        { desktopImageId: "first", mobileImageId: "first-mobile", imageAlt: "Primeiro conjunto" },
        { desktopImageId: "second", mobileImageId: "first-mobile", focalPosition: "center" as const },
      ],
    };
    expect(homepageSectionsSchema.parse([defaultBrandHeroSection])[0]).toMatchObject(defaultBrandHeroSection);
    expect(homepageSectionsSchema.parse([hero])[0]).toMatchObject(hero);
    expect(homepageMediaIds([hero])).toEqual(["legacy", "first", "first-mobile", "second"]);
  });

  it("rejects incomplete carousel images and more than six slides", () => {
    const validate = (slides: unknown[]) => homepageWriteSchema.safeParse({
      sections: [{ ...defaultBrandHeroSection, slides }], expectedVersion: 1,
    }).success;
    expect(validate([])).toBe(true);
    expect(validate([{ desktopImageId: "photo" }])).toBe(true);
    expect(validate([{ mobileImageId: "mobile-only" }])).toBe(false);
    expect(validate([{ desktopImageId: "photo", imageAlt: "   " }])).toBe(false);
    expect(validate(Array.from({ length: 7 }, (_, i) => ({ desktopImageId: `photo-${i}` })))).toBe(false);
  });

});
