import type { FastifyInstance } from "fastify";
import { navigationWriteSchema } from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { getNavigation, updateNavigation } from "./application/service.js";

export async function registerNavigationRoutes(app: FastifyInstance) {
  app.get("/v1/admin/navigation/:key", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { key } = request.params as { key: string };
      return { data: await getNavigation(key) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/navigation/:key", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { key } = request.params as { key: string };
      const data = await updateNavigation(key, navigationWriteSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "navigation",
        entityId: key,
      });
      await revalidateSite(["site", "navigation"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
