import { Prisma, prisma } from "@oston/database";
import type { SessionUser } from "@oston/contracts";
import type { FastifyRequest } from "fastify";
import { clientIp } from "./http.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "blob",
]);

function sanitizeMetadata(input: Record<string, unknown> | undefined) {
  if (!input) {
    return undefined;
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      continue;
    }
    output[key] = value;
  }
  return output;
}

export async function writeAudit(input: {
  request: FastifyRequest;
  actor?: SessionUser | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actor?.id ?? null,
      actorEmail: input.actor?.email ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: sanitizeMetadata(input.metadata) as Prisma.InputJsonValue | undefined,
      ip: clientIp(input.request),
      userAgent: typeof input.request.headers["user-agent"] === "string"
        ? input.request.headers["user-agent"]
        : null,
    },
  });
}
