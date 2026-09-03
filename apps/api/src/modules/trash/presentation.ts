import type { FastifyInstance } from "fastify";
import { prisma } from "@oston/database";
import { writeAudit } from "../../lib/audit.js";
import { sendProblem } from "../../lib/errors.js";
import { HttpError } from "../../lib/errors.js";
import { requireUser } from "../../lib/http.js";
import { revalidateSite } from "../../lib/revalidate.js";
import { wantsTrash } from "../../lib/cms-prisma.js";

type TrashKind = "collection" | "product" | "campaign";

function mapTrashItem(
  kind: TrashKind,
  row: { id: string; name: string; updatedAt: Date; deletedAt: Date | null; status: string; slug?: string },
) {
  return {
    id: row.id,
    kind,
    name: row.name,
    slug: row.slug ?? null,
    status: row.status,
    deletedAt: row.deletedAt ?? row.updatedAt,
  };
}

export async function listTrashedContent() {
  const where = { deletedAt: { not: null } };
  const [collections, products, campaigns] = await Promise.all([
    prisma.collection.findMany({ where, orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.product.findMany({ where, orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.campaign.findMany({ where, orderBy: { updatedAt: "desc" }, take: 50 }),
  ]);
  return [
    ...collections.map((row) => mapTrashItem("collection", row)),
    ...products.map((row) => mapTrashItem("product", row)),
    ...campaigns.map((row) => mapTrashItem("campaign", row)),
  ].sort((left, right) => {
    const leftAt = left.deletedAt instanceof Date ? left.deletedAt.getTime() : 0;
    const rightAt = right.deletedAt instanceof Date ? right.deletedAt.getTime() : 0;
    return rightAt - leftAt;
  });
}

export async function restoreTrashed(kind: TrashKind, id: string): Promise<{ id: string; status: string }> {
  if (kind === "collection") {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Registro não encontrado.", { code: "NOT_FOUND" });
    const row = await prisma.collection.update({ where: { id }, data: { deletedAt: null, status: "DRAFT" } });
    return { id: row.id, status: row.status };
  }
  if (kind === "product") {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Registro não encontrado.", { code: "NOT_FOUND" });
    const row = await prisma.product.update({ where: { id }, data: { deletedAt: null, status: "DRAFT" } });
    return { id: row.id, status: row.status };
  }
  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Registro não encontrado.", { code: "NOT_FOUND" });
  const row = await prisma.campaign.update({ where: { id }, data: { deletedAt: null, status: "DRAFT" } });
  return { id: row.id, status: row.status };
}

export async function registerTrashRoutes(app: FastifyInstance) {
  app.get("/v1/admin/trash", async (request, reply) => {
    try {
      await requireUser(request, "content:read");
      return { data: await listTrashedContent() };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.post("/v1/admin/trash/:kind/:id/restore", async (request, reply) => {
    try {
      const user = await requireUser(request, "content:write");
      const { kind, id } = request.params as { kind: string; id: string };
      if (kind !== "collection" && kind !== "product" && kind !== "campaign") {
        throw new HttpError(400, "Tipo inválido para restauração.", { code: "VALIDATION_ERROR" });
      }
      const data = await restoreTrashed(kind, id);
      await writeAudit({
        request,
        actor: user,
        action: "UPDATE",
        entity: kind,
        entityId: id,
        metadata: { restored: true },
      });
      await revalidateSite(["site", "collections", "products", "campaigns"]);
      return { data: { id: data.id, status: data.status } };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}

export { wantsTrash };
