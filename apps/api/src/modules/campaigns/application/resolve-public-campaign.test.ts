import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../../../lib/errors.js";
import { getActiveCampaign, getCampaign } from "./service.js";
import { resolvePublicCampaign } from "./resolve-public-campaign.js";

vi.mock("./service.js", () => ({ getActiveCampaign: vi.fn(), getCampaign: vi.fn() }));

const now = new Date("2026-05-10T12:00:00Z");
const campaign = {
  id: "mothers-day", name: "Dia das Mães", title: "À mesa", eyebrow: null, subtitle: null,
  desktopImage: null, mobileImage: null, video: null, imageAlt: "Panelas OSTON",
  primaryCtaLabel: "Coleções", primaryCtaUrl: "/colecoes", secondaryCtaLabel: null, secondaryCtaUrl: null,
  textAlign: "left" as const, focalPosition: "center" as const, overlay: 42, collectionId: null,
  startsAt: new Date("2026-05-01T00:00:00Z"), endsAt: new Date("2026-05-11T00:00:00Z"),
  status: "PUBLISHED" as const, sortOrder: 0, version: 1, deletedAt: null,
  createdAt: now, updatedAt: now,
};

describe("editorial campaign selection", () => {
  beforeEach(() => vi.resetAllMocks());

  it("uses automatic selection only without a pinned campaign", async () => {
    vi.mocked(getActiveCampaign).mockResolvedValue(campaign);
    expect(await resolvePublicCampaign(null, { now })).toEqual(campaign);
    expect(getCampaign).not.toHaveBeenCalled();
  });

  it.each([
    { endsAt: now },
    { startsAt: new Date(now.getTime() + 1) },
    { deletedAt: now },
    { status: "DRAFT" as const },
    { status: "ARCHIVED" as const },
  ])("hides an ineligible pinned campaign without substituting another offer: %j", async (override) => {
    vi.mocked(getCampaign).mockResolvedValue({ ...campaign, ...override });
    expect(await resolvePublicCampaign(campaign.id, { now })).toBeNull();
    expect(getActiveCampaign).not.toHaveBeenCalled();
  });

  it("shows the selected saved draft only to the explicit preview caller", async () => {
    vi.mocked(getCampaign).mockResolvedValue({ ...campaign, status: "DRAFT" });
    expect(await resolvePublicCampaign(campaign.id, { now })).toBeNull();
    expect(await resolvePublicCampaign(campaign.id, { now, preview: true })).toMatchObject({ id: campaign.id, status: "DRAFT" });
  });

  it("never previews a deleted campaign", async () => {
    vi.mocked(getCampaign).mockResolvedValue({ ...campaign, deletedAt: now });
    expect(await resolvePublicCampaign(campaign.id, { now, preview: true })).toBeNull();
  });

  it("hides a missing selection but does not disguise a database failure", async () => {
    vi.mocked(getCampaign).mockRejectedValueOnce(new HttpError(404, "not found"));
    expect(await resolvePublicCampaign("missing", { now })).toBeNull();
    vi.mocked(getCampaign).mockRejectedValueOnce(new Error("database unavailable"));
    await expect(resolvePublicCampaign(campaign.id, { now })).rejects.toThrow("database unavailable");
  });
});
