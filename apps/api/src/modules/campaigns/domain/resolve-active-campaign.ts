import type { ContentStatus } from "@oston/contracts";

export type CampaignWindow = {
  status: ContentStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  sortOrder: number;
  updatedAt: Date;
};

export function isCampaignLive(campaign: CampaignWindow, now = new Date()) {
  if (campaign.status === "DRAFT" || campaign.status === "ARCHIVED") {
    return false;
  }

  if (campaign.status !== "PUBLISHED" && campaign.status !== "SCHEDULED") {
    return false;
  }

  if (campaign.startsAt && campaign.startsAt.getTime() > now.getTime()) {
    return false;
  }

  if (campaign.endsAt && campaign.endsAt.getTime() < now.getTime()) {
    return false;
  }

  return true;
}

export function resolveActiveCampaign<T extends CampaignWindow>(campaigns: T[], now = new Date()) {
  return (
    campaigns
      .filter((campaign) => isCampaignLive(campaign, now))
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      })[0] ?? null
  );
}
