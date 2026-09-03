import type { FastifyInstance } from "fastify";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { clientIp, noStore, requireUser } from "../../lib/http.js";
import { consumeThrottle } from "../../lib/throttle.js";
import {
  addLeadNote,
  createLead,
  exportLeadsCsv,
  getLeadById,
  listLeads,
  mapLead,
  updateLead,
} from "./application/service.js";

export async function registerLeadRoutes(app: FastifyInstance) {
  app.post("/v1/public/leads", async (request, reply) => {
    try {
      await consumeThrottle("lead:ip", clientIp(request));
      const result = await createLead(request.body);
      if (result.ignored) {
        return reply.status(201).send({ ok: true });
      }
      return reply.status(201).send({ ok: true, id: result.lead.id });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/leads/export", async (request, reply) => {
    try {
      noStore(reply);
      const user = await requireUser(request, "leads:export");
      const csv = await exportLeadsCsv(request.query);
      await writeAudit({
        request,
        actor: user,
        action: "EXPORT",
        entity: "lead",
        metadata: { format: "csv" },
      });
      return reply
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", 'attachment; filename="leads.csv"')
        .send(csv);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/leads", async (request, reply) => {
    try {
      noStore(reply);
      await requireUser(request, "leads:read");
      return await listLeads(request.query);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/leads/:id", async (request, reply) => {
    try {
      noStore(reply);
      await requireUser(request, "leads:read");
      const { id } = request.params as { id: string };
      return { data: await getLeadById(id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.patch("/v1/admin/leads/:id", async (request, reply) => {
    try {
      noStore(reply);
      const user = await requireUser(request, "leads:write");
      const { id } = request.params as { id: string };
      const result = await updateLead(id, request.body, user);
      await writeAudit({
        request,
        actor: user,
        action: result.statusChanged ? "STATUS_CHANGE" : "UPDATE",
        entity: "lead",
        entityId: id,
        metadata: {
          status: result.lead.status,
          from: result.previousStatus,
          to: result.lead.status,
          assignedToId: result.lead.assignedToId,
          name: result.lead.name,
        },
      });
      return { data: mapLead(result.lead) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/leads/:id/notes", async (request, reply) => {
    try {
      noStore(reply);
      const user = await requireUser(request, "leads:write");
      const { id } = request.params as { id: string };
      const note = await addLeadNote(id, request.body, user);
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "lead",
        entityId: id,
        metadata: { noteId: note.id, name: "nota" },
      });
      return reply.status(201).send({ data: note });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
