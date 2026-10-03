import type { FastifyInstance } from "fastify";
import { defaultHomepageSections } from "@oston/contracts";
import { sendProblem } from "../../lib/errors.js";
import { resolvePublicCampaign } from "../campaigns/application/resolve-public-campaign.js";
import { listPublishedCollections } from "../collections/application/service.js";
import { getActiveAnnouncement } from "../announcements/application/service.js";
import { getHomepage, seasonalCampaignSlot, withCampaignPreviewSlot } from "../homepage/application/service.js";
import { getPublicNavigation } from "../navigation/application/service.js";
import { listPublishedPageSummaries } from "../pages/application/service.js";
import { getProductBySlug, listPublishedProducts } from "../products/application/service.js";
import { getCollectionBySlug } from "../collections/application/service.js";
import { getSettings } from "../site-settings/application/service.js";

async function safe<T>(factory: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await factory();
  } catch {
    return fallback;
  }
}

export async function assemblePublicSite(options?: { preview?: boolean; campaignId?: string }) {
  const [settings, homepage, navigation, announcement, collections, pages] = await Promise.all([
    getSettings(),
    safe(getHomepage, { id: "default", sections: defaultHomepageSections, version: 1, updatedAt: new Date(0) }),
    safe(getPublicNavigation, { header: [], footer: [] }),
    safe(getActiveAnnouncement, null),
    listPublishedCollections(),
    safe(listPublishedPageSummaries, []),
  ]);

  const featured = collections.filter((collection) => collection.featured).slice(0, 6);
  const slot = seasonalCampaignSlot(homepage.sections);
  const previewCampaignId = options?.preview ? options.campaignId : undefined;
  const campaign = slot.enabled || previewCampaignId
    ? await resolvePublicCampaign(previewCampaignId ?? slot.campaignId, { preview: options?.preview })
    : null;

  return {
    settings,
    campaign,
    collections: featured,
    homepage: {
      sections: previewCampaignId && campaign ? withCampaignPreviewSlot(homepage.sections) : homepage.sections,
      version: homepage.version,
    },
    navigation,
    announcement,
    pages,
  };
}

export async function registerPublicRoutes(app: FastifyInstance) {
  app.get("/v1/public/site", async (request, reply) => {
    try {
      return { data: await assemblePublicSite() };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/public/collections", async (request, reply) => {
    try {
      return { data: await listPublishedCollections() };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/public/collections/:slug", async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const collection = await getCollectionBySlug(slug);
      const products = await listPublishedProducts(collection.id);
      return { data: { collection, products } };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/public/products/:slug", async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      return { data: await getProductBySlug(slug) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
