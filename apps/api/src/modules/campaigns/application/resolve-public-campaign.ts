import { HttpError } from "../../../lib/errors.js";
import { isCampaignLive } from "../domain/resolve-active-campaign.js";
import { getActiveCampaign, getCampaign } from "./service.js";

/** An explicit editorial choice never falls through to an unrelated promotion. */
export async function resolvePublicCampaign(campaignId: string | null, options: { preview?: boolean; now?: Date } = {}) {
  const now = options.now ?? new Date();
  if (!campaignId) return getActiveCampaign(now);
  try {
    const selected = await getCampaign(campaignId);
    if (selected.deletedAt) return null;
    return options.preview || isCampaignLive(selected, now) ? selected : null;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}
