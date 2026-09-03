import type { FastifyInstance } from "fastify";
import { announcementWriteSchema } from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import {
  createAnnouncement,
  deactivateAnnouncement,
  getAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "./application/service.js";

export async function registerAnnouncementRoutes(app: FastifyInstance) {
  app.get("/v1/admin/announcements", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return await listAnnouncements(request.query);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/announcements/:id", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { id } = request.params as { id: string };
      return { data: await getAnnouncement(id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/announcements", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const data = await createAnnouncement(announcementWriteSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: "CREATE",
        entity: "announcement",
        entityId: data.id,
      });
      await revalidateSite(["site", "announcements"]);
      return reply.status(201).send({ data });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/announcements/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await updateAnnouncement(id, announcementWriteSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "announcement",
        entityId: id,
      });
      await revalidateSite(["site", "announcements"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/announcements/:id/deactivate", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await deactivateAnnouncement(id);
      await writeAudit({
        request,
        actor: user,
        action: "UNPUBLISH",
        entity: "announcement",
        entityId: id,
      });
      await revalidateSite(["site", "announcements"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
