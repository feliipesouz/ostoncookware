import type { FastifyInstance } from "fastify";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { noStore, requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { exportProductsCsv, importProducts, previewProductImport } from "./service.js";

export async function registerCatalogImportRoutes(app: FastifyInstance) {
  app.post("/v1/admin/products/import/preview", async (request, reply) => {
    try {
      noStore(reply);
      await requireUser(request, "content:write");
      return { data: await previewProductImport(request.body) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/products/import", async (request, reply) => {
    try {
      noStore(reply);
      const user = await requireUser(request, "content:write");
      const data = await importProducts(request.body);
      await writeAudit({
        request,
        actor: user,
        action: "IMPORT",
        entity: "product",
        metadata: { creates: data.creates, updates: data.updates, skips: data.skips },
      });
      await revalidateSite(["products", "collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/products/export.csv", async (request, reply) => {
    try {
      noStore(reply);
      await requireUser(request, "content:read");
      const query = request.query as { ids?: string };
      const ids = query.ids ? query.ids.split(",").map((id) => id.trim()).filter(Boolean) : undefined;
      const csv = await exportProductsCsv(ids);
      return reply
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", 'attachment; filename="produtos.csv"')
        .send(csv);
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

}
