import { describe, expect, it } from "vitest";
import { isCampaignLive, resolveActiveCampaign } from "./resolve-active-campaign.js";
import { campaignWriteSchema } from "@oston/contracts";

const base = {
  startsAt: null,
  endsAt: null,
  sortOrder: 1,
  updatedAt: new Date("2026-09-01T12:00:00.000Z"),
};

describe("resolveActiveCampaign", () => {
  it("ignores draft and archived campaigns", () => {
    expect(isCampaignLive({ ...base, status: "DRAFT" })).toBe(false);
    expect(isCampaignLive({ ...base, status: "ARCHIVED" })).toBe(false);
  });

  it("activates a scheduled campaign inside its window", () => {
    const now = new Date("2026-09-03T12:00:00.000Z");
    const live = {
      ...base,
      status: "SCHEDULED" as const,
      startsAt: new Date("2026-09-01T00:00:00.000Z"),
      endsAt: new Date("2026-09-10T00:00:00.000Z"),
    };
    expect(isCampaignLive(live, now)).toBe(true);
  });

  it("picks the lowest sortOrder among live campaigns", () => {
    const now = new Date("2026-09-03T12:00:00.000Z");
    const selected = resolveActiveCampaign(
      [
        { ...base, status: "PUBLISHED", sortOrder: 5, updatedAt: new Date("2026-09-03") },
        { ...base, status: "PUBLISHED", sortOrder: 1, updatedAt: new Date("2026-08-01") },
      ],
      now,
    );
    expect(selected?.sortOrder).toBe(1);
  });

  it("starts at the exact beginning and excludes the exact ending", () => {
    const startsAt = new Date("2026-05-01T00:00:00Z");
    const endsAt = new Date("2026-05-11T00:00:00Z");
    const campaign = { ...base, status: "SCHEDULED" as const, startsAt, endsAt };
    expect(isCampaignLive(campaign, new Date(startsAt.getTime() - 1))).toBe(false);
    expect(isCampaignLive(campaign, startsAt)).toBe(true);
    expect(isCampaignLive(campaign, new Date(endsAt.getTime() - 1))).toBe(true);
    expect(isCampaignLive(campaign, endsAt)).toBe(false);
    expect(isCampaignLive({ ...campaign, endsAt: startsAt }, startsAt)).toBe(false);
  });

  it("never activates soft-deleted or malformed scheduled campaigns", () => {
    expect(isCampaignLive({ ...base, status: "PUBLISHED", deletedAt: new Date() })).toBe(false);
    expect(isCampaignLive({ ...base, status: "SCHEDULED", startsAt: null })).toBe(false);
  });

  it("uses a stable ID tie-breaker after priority and update time", () => {
    const first = { ...base, id: "a", status: "PUBLISHED" as const };
    const second = { ...base, id: "b", status: "PUBLISHED" as const };
    expect(resolveActiveCampaign([second, first])?.id).toBe("a");
    expect(resolveActiveCampaign([first, second])?.id).toBe("a");
  });
});

describe("campaign publication contract", () => {
  const input = {
    name: "Dia das Mães", title: "Encontros à mesa", desktopImageId: "desktop", mobileImageId: "mobile",
    imageAlt: "Conjunto de panelas", primaryCtaLabel: "Conhecer", primaryCtaUrl: "/colecoes",
  };

  it("rejects scheduling without a start date and zero-length windows", () => {
    expect(campaignWriteSchema.safeParse({ ...input, status: "SCHEDULED" }).success).toBe(false);
    expect(campaignWriteSchema.safeParse({ ...input, startsAt: "2026-05-10T10:00:00Z", endsAt: "2026-05-10T10:00:00Z" }).success).toBe(false);
    expect(campaignWriteSchema.safeParse({ ...input, status: "SCHEDULED", startsAt: "2026-05-10T10:00:00Z", endsAt: "2026-05-11T10:00:00Z" }).success).toBe(true);
  });

  it("requires both halves of a secondary call to action", () => {
    expect(campaignWriteSchema.safeParse({ ...input, secondaryCtaUrl: "/contato" }).success).toBe(false);
    expect(campaignWriteSchema.safeParse({ ...input, secondaryCtaLabel: "Conversar" }).success).toBe(false);
  });
});
