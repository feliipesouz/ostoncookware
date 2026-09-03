import type { FastifyInstance } from "fastify";
import { campaignWriteSchema } from "@oston/contracts";
import { requireUser } from "../../lib/http.js";
import { writeAudit } from "../../lib/audit.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { sendProblem } from "../../lib/errors.js";
import {
  archiveCampaign,
  createCampaign,
  getCampaign,
  hardDeleteCampaign,
  listCampaigns,
  restoreCampaign,
  softDeleteCampaign,
  updateCampaign,
} from "./application/service.js";

export async function registerCampaignRoutes(app: FastifyInstance) {
  app.get("/v1/admin/campaigns", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return await listCampaigns(request.query);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/campaigns/:id", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { id } = request.params as { id: string };
      return { data: await getCampaign(id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/campaigns", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const payload = campaignWriteSchema.parse(request.body);
      const data = await createCampaign(payload, user);
      await writeAudit({
        request,
        actor: user,
        action: "CREATE",
        entity: "campaign",
        entityId: data.id,
        metadata: { name: data.name, status: data.status },
      });
      await revalidateSite(["campaigns", "site"]);
      return reply.status(201).send({ data });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/campaigns/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const payload = campaignWriteSchema.parse(request.body);
      const data = await updateCampaign(id, payload, user);
      await writeAudit({
        request,
        actor: user,
        action: data.status === "PUBLISHED" ? "PUBLISH" : "UPDATE",
        entity: "campaign",
        entityId: id,
        metadata: { status: data.status, version: data.version },
      });
      await revalidateSite(["campaigns", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/campaigns/:id/archive", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await archiveCampaign(id);
      await writeAudit({
        request,
        actor: user,
        action: "ARCHIVE",
        entity: "campaign",
        entityId: id,
      });
      await revalidateSite(["campaigns", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/campaigns/:id/trash", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await softDeleteCampaign(id, user);
      await writeAudit({ request, actor: user, action: "DELETE", entity: "campaign", entityId: id });
      await revalidateSite(["campaigns", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/campaigns/:id/restore", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await restoreCampaign(id, user);
      await writeAudit({ request, actor: user, action: "RESTORE", entity: "campaign", entityId: id });
      await revalidateSite(["campaigns", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.delete("/v1/admin/campaigns/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:delete");
      const { id } = request.params as { id: string };
      await hardDeleteCampaign(id);
      await writeAudit({ request, actor: user, action: "DELETE", entity: "campaign", entityId: id, metadata: { hard: true } });
      await revalidateSite(["campaigns", "site"]);
      return reply.status(204).send();
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
