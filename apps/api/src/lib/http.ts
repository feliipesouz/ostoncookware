import { randomUUID } from "node:crypto";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { SessionUser } from "@oston/contracts";
import { auth } from "../modules/auth/infrastructure/auth.js";
import { assertCan, assertRole, type Permission } from "./authz.js";
import { HttpError } from "./errors.js";

export async function getSessionUser(request: FastifyRequest): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session?.user) {
    return null;
  }

  const role = assertRole(
    "role" in session.user ? String(session.user.role) : undefined,
  );

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
  };
}

export async function requireUser(request: FastifyRequest, permission?: Permission) {
  const user = await getSessionUser(request);

  if (!user) {
    throw new HttpError(401, "Autenticação necessária.", { code: "UNAUTHORIZED" });
  }

  if (permission) {
    assertCan(user.role, permission);
  }

  return user;
}

export function clientIp(request: FastifyRequest) {
  // Fastify applies the deployment's trustProxy policy; never re-read arbitrary
  // forwarding headers here or the persistent throttle can be bypassed locally.
  return request.ip;
}

export function requestId(request: FastifyRequest) {
  return request.id || randomUUID();
}

export function noStore(reply: FastifyReply) {
  reply.header("Cache-Control", "no-store, private");
  reply.header("Pragma", "no-cache");
}
