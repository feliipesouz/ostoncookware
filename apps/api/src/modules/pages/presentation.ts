import type { FastifyInstance } from "fastify";
import { pageWriteSchema } from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { createPage, getPage, getPageBySlug, listPages, updatePage } from "./application/service.js";

export async function registerPageRoutes(app: FastifyInstance) {
  app.get("/v1/admin/pages", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return await listPages(request.query);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/pages/:id", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { id } = request.params as { id: string };
      return { data: await getPage(id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/pages", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const data = await createPage(pageWriteSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: "CREATE",
        entity: "page",
        entityId: data.id,
        metadata: { slug: data.slug },
      });
      await revalidateSite(["site", "pages"]);
      return reply.status(201).send({ data });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/pages/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await updatePage(id, pageWriteSchema.parse(request.body));
      await writeAudit({
        request,
        actor: user,
        action: data.status === "PUBLISHED" ? "PUBLISH" : "UPDATE",
        entity: "page",
        entityId: id,
        metadata: { slug: data.slug, status: data.status },
      });
      await revalidateSite(["site", "pages"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/public/pages/:slug", async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      return { data: await getPageBySlug(slug) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
