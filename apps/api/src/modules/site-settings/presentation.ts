import type { FastifyInstance } from "fastify";
import { siteSettingsWriteSchema } from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { getSettings, updateSettings } from "./application/service.js";

export async function registerSettingsRoutes(app: FastifyInstance) {
  app.get("/v1/admin/settings", async (request, reply) => {
    try {
      await requireUser(request, "settings:read");
      return { data: await getSettings() };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/settings", async (request, reply) => {
    try {
      const user = await requireUser(request, "settings:write");
      const data = await updateSettings(siteSettingsWriteSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "settings",
        entityId: "default",
        metadata: { name: data.brandName },
      });
      await revalidateSite(["settings", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
