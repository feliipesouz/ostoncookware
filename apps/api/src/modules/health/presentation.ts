import type { FastifyInstance } from "fastify";
import { prisma } from "@oston/database";
import { loadEnv } from "../../config/env.js";
import { sendProblem } from "../../lib/errors.js";
import { noStore, requireUser } from "../../lib/http.js";

export async function registerHealth(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    noStore(reply);
    return { status: "ok" };
  });

  app.get("/ready", async (_request, reply) => {
    noStore(reply);
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch {
      return reply.status(503).send({ status: "not-ready" });
    }
  });

  app.get("/v1/admin/system", async (request, reply) => {
    try {
      noStore(reply);
      await requireUser(request, "system:read");
      const env = loadEnv();

      let database: "ok" | "error" = "ok";
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch {
        database = "error";
      }

      const vercelEnv = env.VERCEL_ENV ?? null;
      const environment =
        vercelEnv === "production" ? "production" : vercelEnv === "preview" ? "staging" : env.NODE_ENV === "production" ? "production" : "development";

      return {
        api: "ok",
        database,
        blobConfigured: Boolean(env.BLOB_READ_WRITE_TOKEN),
        environment,
        vercelEnv,
      };
    } catch (error) {
      return sendProblem(request, reply, error);
    }
  });
}
