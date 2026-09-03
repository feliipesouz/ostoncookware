import type { FastifyInstance } from "fastify";
import { collectionWriteSchema } from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import {
  archiveCollection,
  createCollection,
  duplicateCollection,
  getCollectionById,
  hardDeleteCollection,
  listCollections,
  restoreCollection,
  softDeleteCollection,
  updateCollection,
} from "./application/service.js";

export async function registerCollectionRoutes(app: FastifyInstance) {
  app.get("/v1/admin/collections", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return await listCollections(request.query);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/collections/:id", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { id } = request.params as { id: string };
      return { data: await getCollectionById(id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/collections", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const data = await createCollection(collectionWriteSchema.parse(request.body), user);
      await writeAudit({
        request,
        actor: user,
        action: "CREATE",
        entity: "collection",
        entityId: data.id,
        metadata: { slug: data.slug },
      });
      await revalidateSite(["collections", "site"]);
      return reply.status(201).send({ data });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/collections/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await updateCollection(id, collectionWriteSchema.parse(request.body), user);
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "collection",
        entityId: id,
        metadata: { status: data.status, slug: data.slug, version: data.version },
      });
      await revalidateSite(["collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/collections/:id/archive", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await archiveCollection(id);
      await writeAudit({ request, actor: user, action: "ARCHIVE", entity: "collection", entityId: id });
      await revalidateSite(["collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/collections/:id/duplicate", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await duplicateCollection(id, user);
      await writeAudit({ request, actor: user, action: "CREATE", entity: "collection", entityId: data.id });
      await revalidateSite(["collections"]);
      return reply.status(201).send({ data });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/collections/:id/trash", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await softDeleteCollection(id, user);
      await writeAudit({ request, actor: user, action: "DELETE", entity: "collection", entityId: id });
      await revalidateSite(["collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/collections/:id/restore", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await restoreCollection(id, user);
      await writeAudit({ request, actor: user, action: "RESTORE", entity: "collection", entityId: id });
      await revalidateSite(["collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.delete("/v1/admin/collections/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:delete");
      const { id } = request.params as { id: string };
      await hardDeleteCollection(id);
      await writeAudit({ request, actor: user, action: "DELETE", entity: "collection", entityId: id, metadata: { hard: true } });
      await revalidateSite(["collections", "site"]);
      return reply.status(204).send();
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
