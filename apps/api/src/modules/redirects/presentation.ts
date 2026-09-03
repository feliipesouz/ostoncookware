import type { FastifyInstance } from "fastify";
import { redirectLookupQuerySchema, redirectPatchSchema, redirectWriteSchema } from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { clientIp, requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { consumeThrottle } from "../../lib/throttle.js";
import {
  createRedirect,
  deactivateRedirect,
  deleteRedirect,
  getRedirect,
  listRedirects,
  lookupRedirect,
  patchRedirect,
  updateRedirect,
} from "./application/service.js";

export async function registerRedirectRoutes(app: FastifyInstance) {
  app.get("/v1/admin/redirects", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return await listRedirects(request.query);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/redirects/:id", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { id } = request.params as { id: string };
      return { data: await getRedirect(id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/redirects", async (request, reply) => {
    try {
      const user = await requireUser(request, "redirects:write");
      const data = await createRedirect(redirectWriteSchema.parse(request.body), user.id);
      await writeAudit({
        request,
        actor: user,
        action: "CREATE",
        entity: "redirect",
        entityId: data.id,
        metadata: { sourcePath: data.sourcePath },
      });
      await revalidateSite(["site"]);
      return reply.status(201).send({ data });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/redirects/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "redirects:write");
      const { id } = request.params as { id: string };
      const data = await updateRedirect(id, redirectWriteSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "redirect",
        entityId: id,
      });
      await revalidateSite(["site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.patch("/v1/admin/redirects/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "redirects:write");
      const { id } = request.params as { id: string };
      const data = await patchRedirect(id, redirectPatchSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "redirect",
        entityId: id,
      });
      await revalidateSite(["site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.delete("/v1/admin/redirects/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "redirects:write");
      const { id } = request.params as { id: string };
      await deleteRedirect(id);
      await writeAudit({
        request,
        actor: user,
        action: "DELETE",
        entity: "redirect",
        entityId: id,
      });
      await revalidateSite(["site"]);
      return reply.status(204).send();
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/redirects/:id/deactivate", async (request, reply) => {
    try {
      const user = await requireUser(request, "redirects:write");
      const { id } = request.params as { id: string };
      const data = await deactivateRedirect(id);
      await writeAudit({
        request,
        actor: user,
        action: "UNPUBLISH",
        entity: "redirect",
        entityId: id,
      });
      await revalidateSite(["site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/public/redirects/lookup", async (request, reply) => {
    try {
      await consumeThrottle("redirect:lookup", clientIp(request));
      const { path } = redirectLookupQuerySchema.parse(request.query);
      const data = await lookupRedirect(path);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
