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
  const vercel = request.headers["x-vercel-forwarded-for"];
  if (typeof vercel === "string" && vercel.length > 0) {
    return vercel.split(",")[0]?.trim() ?? request.ip;
  }
  const realIp = request.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.length > 0) {
    return realIp.trim();
  }
  return request.ip;
}

export function requestId(request: FastifyRequest) {
  const existing = request.headers["x-request-id"];
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }
  return randomUUID();
}

export function noStore(reply: FastifyReply) {
  reply.header("Cache-Control", "no-store, private");
  reply.header("Pragma", "no-cache");
}
