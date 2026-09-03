import type { FastifyInstance } from "fastify";
import { productBulkSchema, productWriteSchema } from "@oston/contracts";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import {
  archiveProduct,
  bulkProducts,
  createProduct,
  getProductById,
  hardDeleteProduct,
  listProducts,
  restoreProduct,
  softDeleteProduct,
  updateProduct,
} from "./application/service.js";

export async function registerProductRoutes(app: FastifyInstance) {
  app.get("/v1/admin/products", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const query = request.query as { collectionId?: string };
      return await listProducts({ collectionId: query.collectionId, query: request.query });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.get("/v1/admin/products/:id", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      const { id } = request.params as { id: string };
      return { data: await getProductById(id) };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/products", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const data = await createProduct(productWriteSchema.parse(request.body), user);
      await writeAudit({
        request,
        actor: user,
        action: "CREATE",
        entity: "product",
        entityId: data.id,
        metadata: { slug: data.slug },
      });
      await revalidateSite(["products", "collections", "site"]);
      return reply.status(201).send({ data });
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.put("/v1/admin/products/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await updateProduct(id, productWriteSchema.parse(request.body), user);
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: "product",
        entityId: id,
        metadata: { status: data.status, version: data.version },
      });
      await revalidateSite(["products", "collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/products/:id/archive", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await archiveProduct(id);
      await writeAudit({ request, actor: user, action: "ARCHIVE", entity: "product", entityId: id });
      await revalidateSite(["products", "collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/products/:id/trash", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await softDeleteProduct(id, user);
      await writeAudit({ request, actor: user, action: "DELETE", entity: "product", entityId: id });
      await revalidateSite(["products", "collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/products/:id/restore", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { id } = request.params as { id: string };
      const data = await restoreProduct(id, user);
      await writeAudit({ request, actor: user, action: "RESTORE", entity: "product", entityId: id });
      await revalidateSite(["products", "collections", "site"]);
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.delete("/v1/admin/products/:id", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:delete");
      const { id } = request.params as { id: string };
      await hardDeleteProduct(id);
      await writeAudit({ request, actor: user, action: "DELETE", entity: "product", entityId: id, metadata: { hard: true } });
      await revalidateSite(["products", "collections", "site"]);
      return reply.status(204).send();
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/products/bulk", async (request, reply) => {
    try {
      const payload = productBulkSchema.parse(request.body);
      const user = await requireUser(request, payload.action === "EXPORT" ? "content:read" : "content:write");
      const result = await bulkProducts(payload);
      await writeAudit({
        request,
        actor: user,
        action: payload.action === "EXPORT" ? "EXPORT" : "UPDATE",
        entity: "product",
        metadata: { action: payload.action, ids: payload.ids },
      });
      if (payload.action !== "EXPORT") {
        await revalidateSite(["products", "collections", "site"]);
      }
      return result;
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
