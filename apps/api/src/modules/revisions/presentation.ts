import type { FastifyInstance } from "fastify";
import {
  campaignWriteSchema,
  collectionWriteSchema,
  homepageWriteSchema,
  pageWriteSchema,
  productWriteSchema,
  revisionEntityTypeSchema,
  revisionRestoreSchema,
  type RevisionEntityType,
} from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { HttpError } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { getRevision, listRevisions } from "../../lib/revisions.js";
import { updateCampaign } from "../campaigns/application/service.js";
import { updateCollection } from "../collections/application/service.js";
import { updateHomepage } from "../homepage/application/service.js";
import { updatePage } from "../pages/application/service.js";
import { getProductById, updateProduct } from "../products/application/service.js";
import { getCollectionById } from "../collections/application/service.js";
import { getCampaign } from "../campaigns/application/service.js";

const ENTITY_BY_ROUTE: Record<string, RevisionEntityType> = {
  products: "product",
  collections: "collection",
  campaigns: "campaign",
  pages: "page",
  homepage: "homepage",
};

function parseEntity(raw: string): RevisionEntityType {
  const entity = ENTITY_BY_ROUTE[raw];
  if (!entity) {
    throw new HttpError(404, "Tipo de conteúdo não encontrado.", { code: "NOT_FOUND" });
  }
  return revisionEntityTypeSchema.parse(entity);
}

export async function registerRevisionRoutes(app: FastifyInstance) {
  app.get("/v1/admin/:entity/:id/revisions", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { entity: raw, id } = request.params as { entity: string; id: string };
      const entity = parseEntity(raw);
      return { data: await listRevisions(entity, id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/:entity/:id/revisions/:revisionId", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { entity: raw, id, revisionId } = request.params as { entity: string; id: string; revisionId: string };
      const entity = parseEntity(raw);
      const revision = await getRevision(revisionId);
      if (revision.entityType !== entity || revision.entityId !== id) {
        throw new HttpError(404, "Revisão não encontrada.", { code: "NOT_FOUND" });
      }
      return { data: revision };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/:entity/:id/revisions/:revisionId/restore", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { entity: raw, id, revisionId } = request.params as { entity: string; id: string; revisionId: string };
      const entity = parseEntity(raw);
      const revision = await getRevision(revisionId);
      if (revision.entityType !== entity || revision.entityId !== id) {
        throw new HttpError(404, "Revisão não encontrada.", { code: "NOT_FOUND" });
      }
      const body = revisionRestoreSchema.parse(request.body ?? {});
      const data = await restoreRevision(entity, id, revision.snapshot, body.expectedVersion, user);
      await writeAudit({
        request,
        actor: user,
        action: "ROLLBACK",
        entity,
        entityId: id,
        metadata: { revisionId, toVersion: revision.version },
      });
      await revalidateSite(["site", "products", "collections", "campaigns"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}

async function restoreRevision(
  entity: RevisionEntityType,
  id: string,
  snapshot: unknown,
  expectedVersion: number | undefined,
  user: { id: string; name: string },
) {
  const payload = snapshot && typeof snapshot === "object" ? { ...(snapshot as Record<string, unknown>), expectedVersion } : { expectedVersion };

  if (entity === "product") {
    const current = await getProductById(id);
    return updateProduct(id, productWriteSchema.parse({ ...payload, expectedVersion: expectedVersion ?? current.version }), user);
  }
  if (entity === "collection") {
    const current = await getCollectionById(id);
    return updateCollection(id, collectionWriteSchema.parse({ ...payload, expectedVersion: expectedVersion ?? current.version }), user);
  }
  if (entity === "campaign") {
    const current = await getCampaign(id);
    return updateCampaign(id, campaignWriteSchema.parse({ ...payload, expectedVersion: expectedVersion ?? current.version }), user);
  }
  if (entity === "page") {
    return updatePage(id, pageWriteSchema.parse({ ...payload, expectedVersion }));
  }
  return updateHomepage(homepageWriteSchema.parse({ ...payload, expectedVersion }));
}
