import type { FastifyInstance } from "fastify";
import type { HandleUploadBody } from "@vercel/blob/client";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { noStore, requireUser } from "../../lib/http.js";
import { loadEnv } from "../../config/env.js";
import {
  completeMedia,
  createUploadToken,
  deleteMedia,
  getMedia,
  getMediaUsage,
  listMedia,
  updateMedia,
} from "./application/service.js";

export async function registerMediaRoutes(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    if (request.url.startsWith("/v1/admin/media")) {
      noStore(reply);
    }
  });

  app.get("/v1/admin/media", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return await listMedia(request.query);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/media/upload", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const env = loadEnv();
      const json = await createUploadToken(
        request.body as HandleUploadBody,
        user.id,
        new Request(`${env.BETTER_AUTH_URL}/v1/admin/media/upload`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(request.body ?? {}),
        }),
      );
      return json;
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/media/complete", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const data = await completeMedia(request.body, user.id);
      await writeAudit({
        request,
        actor: user,
        action: "UPLOAD",
        entity: "media",
        entityId: data.id,
        metadata: { pathname: data.pathname, mimeType: data.mimeType },
      });
      return reply.status(201).send({ data });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/media/:id/usage", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { id } = request.params as { id: string };
      await getMedia(id);
      const items = await getMediaUsage(id);
      return { data: { total: items.length, items } };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.patch("/v1/admin/media/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await updateMedia(id, request.body);
      await writeAudit({ request, actor: user, action: "UPDATE", entity: "media", entityId: id });
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.delete("/v1/admin/media/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const deleted = await getMedia(id);
      await deleteMedia(id);
      await writeAudit({
        request,
        actor: user,
        action: "DELETE",
        entity: "media",
        entityId: id,
        metadata: { name: deleted.originalFilename },
      });
      return reply.status(204).send();
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
