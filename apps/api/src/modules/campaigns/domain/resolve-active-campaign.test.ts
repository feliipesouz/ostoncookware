import { describe, expect, it } from "vitest";
import { isCampaignLive, resolveActiveCampaign } from "./resolve-active-campaign.js";

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
});
