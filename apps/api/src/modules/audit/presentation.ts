import type { FastifyInstance } from "fastify";
import { adminUserRoleUpdateSchema, paginationQuerySchema } from "@oston/contracts";
import { Prisma, prisma } from "@oston/database";
import { humanAuditMessage } from "../../lib/audit-copy.js";
import { sendProblem } from "../../lib/errors.js";
import { HttpError } from "../../lib/errors.js";
import { noStore, requireUser } from "../../lib/http.js";
import { toPage } from "../../lib/pagination.js";
import { writeAudit } from "../../lib/audit.js";

function parseDateBound(value: unknown, endOfDay: boolean) {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "Data inválida.", { code: "INVALID_DATE" });
  }
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parsed.setUTCHours(23, 59, 59, 999);
  }
  return parsed;
}

export async function registerAuditRoutes(app: FastifyInstance) {
  app.get("/v1/admin/audit", async (request, reply) => {
    try {
      noStore(reply);
      await requireUser(request, "audit:read");
      const pagination = paginationQuerySchema.parse(request.query);
      const query = request.query as {
        actorId?: string;
        entity?: string;
        action?: string;
        from?: string;
        to?: string;
        q?: string;
      };

      const from = parseDateBound(query.from, false);
      const to = parseDateBound(query.to, true);
      const where: Prisma.AuditLogWhereInput = {
        actorId: query.actorId || undefined,
        entity: query.entity || undefined,
        action: query.action || undefined,
        createdAt: from || to ? { gte: from, lte: to } : undefined,
        ...(pagination.q
          ? {
              OR: [
                { actorEmail: { contains: pagination.q, mode: "insensitive" } },
                { action: { contains: pagination.q, mode: "insensitive" } },
                { entity: { contains: pagination.q, mode: "insensitive" } },
                { entityId: { contains: pagination.q } },
              ],
            }
          : {}),
      };

      const [rows, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          include: { actor: { select: { id: true, name: true, email: true } } },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return toPage(
        rows.map((row) => ({
          ...row,
          actorName: row.actor?.name ?? null,
          humanMessage: humanAuditMessage({
            action: row.action,
            entity: row.entity,
            entityId: row.entityId,
            actorName: row.actor?.name,
            actorEmail: row.actorEmail,
            metadata: (row.metadata as Record<string, unknown> | null) ?? null,
          }),
        })),
        total,
        pagination.page,
        pagination.pageSize,
      );
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}

export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/v1/admin/users", async (request, reply) => {
    try {
      noStore(reply);
      await requireUser(request, "users:read");
      const data = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });

  app.patch("/v1/admin/users/:id", async (request, reply) => {
    try {
      noStore(reply);
      const actor = await requireUser(request, "users:write");
      const { id } = request.params as { id: string };
      const payload = adminUserRoleUpdateSchema.parse(request.body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) {
        throw new HttpError(404, "Usuário não encontrado.", { code: "NOT_FOUND" });
      }
      if (target.role === "OWNER") {
        throw new HttpError(403, "O papel OWNER não pode ser alterado por esta API.", {
          code: "FORBIDDEN",
        });
      }

      const data = await prisma.user.update({
        where: { id },
        data: { role: payload.role },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      await writeAudit({
        request,
        actor,
        action: "ROLE_CHANGE",
        entity: "user",
        entityId: id,
        metadata: { from: target.role, to: data.role, role: data.role, name: data.name },
      });
      return { data };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
