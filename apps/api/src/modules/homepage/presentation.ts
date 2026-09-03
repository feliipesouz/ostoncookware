import type { FastifyInstance } from "fastify";
import { homepageWriteSchema } from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { getHomepage, updateHomepage } from "./application/service.js";

export async function registerHomepageRoutes(app: FastifyInstance) {
  app.get("/v1/admin/homepage", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return { data: await getHomepage() };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/homepage", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const data = await updateHomepage(homepageWriteSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "homepage",
        entityId: "default",
        metadata: { version: data.version },
      });
      await revalidateSite(["site", "homepage"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
