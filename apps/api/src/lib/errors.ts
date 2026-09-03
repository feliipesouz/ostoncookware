import { randomUUID, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly type: string;
  readonly expose: boolean;
  readonly detail?: string;
  readonly meta?: Record<string, unknown>;

  constructor(
    status: number,
    title: string,
    options?: { code?: string; type?: string; expose?: boolean; detail?: string; meta?: Record<string, unknown> },
  ) {
    super(title);
    this.name = "HttpError";
    this.status = status;
    this.code = options?.code ?? "HTTP_ERROR";
    this.type = options?.type ?? `https://ostoncookware.com/problems/${this.code.toLowerCase()}`;
    this.expose = options?.expose ?? status < 500;
    this.detail = options?.detail;
    this.meta = options?.meta;
  }
}

function prismaClientError(error: unknown): error is { code: string } {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string" &&
      "clientVersion" in error,
  );
}

export function sendProblem(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
) {
  const instance = request.url.split("?")[0] ?? request.url;
  const correlationId = request.id ?? randomUUID();
  reply.header("x-request-id", correlationId);

  if (error instanceof ZodError) {
    return reply.status(400).send({
      type: "https://ostoncookware.com/problems/validation",
      title: "Dados inválidos",
      status: 400,
      code: "VALIDATION_ERROR",
      instance,
      correlationId,
      detail: error.issues.map((issue) => issue.message).join(" "),
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof HttpError) {
    const meta = error.meta ?? {};
    return reply.status(error.status).send({
      type: error.type,
      title: error.message,
      status: error.status,
      code: error.code,
      instance,
      correlationId,
      ...(error.detail ? { detail: error.detail } : {}),
      ...(error.meta ? { meta: error.meta } : {}),
      ...(error.code === "VERSION_CONFLICT"
        ? {
            updatedByName: typeof meta.updatedBy === "string" ? meta.updatedBy : null,
            updatedAt: typeof meta.updatedAt === "string" ? meta.updatedAt : null,
            currentVersion: typeof meta.currentVersion === "number" ? meta.currentVersion : null,
          }
        : {}),
    });
  }

  if (prismaClientError(error)) {
    if (error.code === "P2002") {
      return reply.status(409).send({
        type: "https://ostoncookware.com/problems/conflict",
        title: uniqueConflictTitle(request, error as { meta?: { target?: unknown } }),
        status: 409,
        code: "CONFLICT",
        instance,
        correlationId,
      });
    }
    if (error.code === "P2003") {
      return reply.status(409).send({
        type: "https://ostoncookware.com/problems/conflict",
        title: "Não é possível concluir porque o registro está em uso.",
        status: 409,
        code: "IN_USE",
        instance,
        correlationId,
      });
    }
    if (error.code === "P2025") {
      return reply.status(404).send({
        type: "https://ostoncookware.com/problems/not-found",
        title: "Registro não encontrado.",
        status: 404,
        code: "NOT_FOUND",
        instance,
        correlationId,
      });
    }
  }

  request.log.error({ err: error, correlationId }, "Unhandled error");

  return reply.status(500).send({
    type: "https://ostoncookware.com/problems/internal",
    title: "Erro interno",
    status: 500,
    code: "INTERNAL_ERROR",
    instance,
    correlationId,
  });
}

function uniqueConflictTitle(request: FastifyRequest, error: { meta?: { target?: unknown } }) {
  const body = request.body && typeof request.body === "object" ? (request.body as Record<string, unknown>) : {};
  const slug = typeof body.slug === "string" ? body.slug : undefined;
  const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
  const isSlug = Boolean(slug) || target.some((field) => field.toLowerCase().includes("slug"));
  if (!isSlug || !slug) {
    return "Já existe um registro com estes dados.";
  }
  const path = request.url;
  if (path.includes("/products")) {
    return `Já existe um produto usando o slug "${slug}".`;
  }
  if (path.includes("/collections")) {
    return `Já existe uma coleção usando o slug "${slug}".`;
  }
  if (path.includes("/pages")) {
    return `Já existe uma página usando o slug "${slug}".`;
  }
  return `Já existe um registro usando o slug "${slug}".`;
}

export function secretsEqual(provided: string, expected: string) {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
