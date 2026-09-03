import type { FastifyInstance } from "fastify";
import { sendProblem } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { getCampaign } from "../campaigns/application/service.js";
import { getCollectionBySlugForPreview } from "../collections/application/service.js";
import { listProducts } from "../products/application/service.js";
import { getHomepage } from "../homepage/application/service.js";
import { getPageBySlug } from "../pages/application/service.js";
import { getProductBySlugForPreview } from "../products/application/service.js";
import { assemblePublicSite } from "../public/presentation.js";

export async function registerPreviewRoutes(app: FastifyInstance) {
  app.get("/v1/admin/preview/products/:slug", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { slug } = request.params as { slug: string };
      return { data: await getProductBySlugForPreview(slug) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/preview/collections/:slug", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { slug } = request.params as { slug: string };
      const collection = await getCollectionBySlugForPreview(slug);
      const products = await listProducts({ collectionId: collection.id, query: { page: 1, pageSize: 50 } });
      return { data: { collection, products: products.data } };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/preview/pages/:slug", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { slug } = request.params as { slug: string };
      return { data: await getPageBySlug(slug, { preview: true }) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/preview/campaigns/:id", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { id } = request.params as { id: string };
      return { data: await getCampaign(id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/preview/home", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return { data: await getHomepage() };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/preview/site", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return { data: await assemblePublicSite({ preview: true }) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
