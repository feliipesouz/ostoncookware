import { describe, expect, it } from "vitest";
import { defaultBrandHeroSection, defaultHomepageSections, homepageMediaIds, homepageSectionsSchema, homepageWriteSchema, withInstitutionalHero, type HomepageSection } from "@oston/contracts";
import { seasonalCampaignSlot, withCampaignPreviewSlot } from "./service.js";

describe("independent homepage editorial slots", () => {
  it("preserves legacy configuration and its pinned campaign while adding the brand", () => {
    const legacy: HomepageSection[] = [{ id: "brand-hero", type: "HERO", enabled: true, campaignId: "mothers-day" }];
    const upgraded = withInstitutionalHero(legacy);
    expect(upgraded).toHaveLength(2);
    expect(upgraded[0]).toMatchObject({ id: "brand-hero-2", type: "BRAND_HERO" });
    expect(upgraded[1]).toBe(legacy[0]);
    expect(seasonalCampaignSlot(upgraded)).toEqual({ enabled: true, campaignId: "mothers-day" });
    expect(withInstitutionalHero(upgraded)).toBe(upgraded);
  });

  it("does not confuse an institutional hero with an enabled seasonal slot", () => {
    expect(seasonalCampaignSlot([defaultBrandHeroSection])).toEqual({ enabled: false, campaignId: null });
    expect(seasonalCampaignSlot([{ id: "seasonal", type: "SEASONAL_CAMPAIGN", enabled: false, campaignId: "campaign" }])).toEqual({ enabled: false, campaignId: null });
  });

  it("temporarily reveals a disabled campaign slot for preview without mutating publication", () => {
    const sections: HomepageSection[] = [defaultBrandHeroSection, { id: "seasonal", type: "SEASONAL_CAMPAIGN", enabled: false }];
    const preview = withCampaignPreviewSlot(sections);
    expect(seasonalCampaignSlot(preview).enabled).toBe(true);
    expect(sections[1]?.enabled).toBe(false);
    expect(withCampaignPreviewSlot([defaultBrandHeroSection])[1]?.type).toBe("SEASONAL_CAMPAIGN");
  });

  it("rejects ambiguous identities, duplicate heroes, incomplete CTAs and missing edit versions", () => {
    expect(homepageSectionsSchema.safeParse(defaultHomepageSections).success).toBe(true);
    expect(homepageWriteSchema.safeParse({ sections: [defaultBrandHeroSection, { ...defaultBrandHeroSection, id: "second" }], expectedVersion: 1 }).success).toBe(false);
    expect(homepageWriteSchema.safeParse({ sections: [{ ...defaultBrandHeroSection, secondaryCtaUrl: undefined }], expectedVersion: 1 }).success).toBe(false);
    expect(homepageWriteSchema.safeParse({ sections: defaultHomepageSections }).success).toBe(false);
  });

  it("preserves legacy reads but prevents publishing duplicate active campaign slots", () => {
    const sections = [
      { id: "legacy", type: "HERO", enabled: true, campaignId: "campaign" },
      { id: "seasonal", type: "SEASONAL_CAMPAIGN", enabled: true },
    ];
    expect(homepageSectionsSchema.safeParse(sections).success).toBe(true);
    expect(homepageWriteSchema.safeParse({ sections, expectedVersion: 1 }).success).toBe(false);
    expect(homepageWriteSchema.safeParse({ sections: sections.map((section, index) => ({ ...section, enabled: index === 0 })), expectedVersion: 1 }).success).toBe(true);
  });

  it("tracks both hero crops and editorial images as media references", () => {
    expect(homepageMediaIds([
      { ...defaultBrandHeroSection, desktopImageId: "hero", mobileImageId: "hero-mobile" },
      { id: "story", type: "EDITORIAL_FEATURE", enabled: true, imageId: "hero" },
    ])).toEqual(["hero", "hero-mobile"]);
  });
});
