import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { loadEnv } from "./config/env.js";
import { sendProblem } from "./lib/errors.js";
import { noStore } from "./lib/http.js";
import { registerAuth } from "./plugins/auth.js";
import { registerSecurity } from "./plugins/security.js";
import { registerHealth } from "./modules/health/presentation.js";
import { registerPublicRoutes } from "./modules/public/presentation.js";
import { registerCampaignRoutes } from "./modules/campaigns/presentation.js";
import { registerCollectionRoutes } from "./modules/collections/presentation.js";
import { registerProductRoutes } from "./modules/products/presentation.js";
import { registerMediaRoutes } from "./modules/media/presentation.js";
import { registerSettingsRoutes } from "./modules/site-settings/presentation.js";
import { registerLeadRoutes } from "./modules/leads/presentation.js";
import { registerDashboardRoutes } from "./modules/dashboard/presentation.js";
import { registerCatalogImportRoutes } from "./modules/catalog-import/presentation.js";
import { registerAuditRoutes, registerUserRoutes } from "./modules/audit/presentation.js";
import { registerHomepageRoutes } from "./modules/homepage/presentation.js";
import { registerNavigationRoutes } from "./modules/navigation/presentation.js";
import { registerAnnouncementRoutes } from "./modules/announcements/presentation.js";
import { registerPageRoutes } from "./modules/pages/presentation.js";
import { registerRedirectRoutes } from "./modules/redirects/presentation.js";
import { registerPreviewRoutes } from "./modules/preview/presentation.js";
import { registerRevisionRoutes } from "./modules/revisions/presentation.js";
import { registerTrashRoutes } from "./modules/trash/presentation.js";
import { registerEventRoutes } from "./modules/events/presentation.js";

import { errorForLog, PINO_REDACT_PATHS, serverLog } from "./lib/logging.js";

let appPromise: Promise<FastifyInstance> | null = null;

export async function buildApp() {
  const env = loadEnv();

  const onVercel = Boolean(process.env.VERCEL);
  const app = Fastify({
    // Vercel uses the structured hooks below; Pino transports require worker files.
    logger: onVercel
      ? false
      : {
          level: env.isProduction ? "info" : "debug",
          redact: {
            paths: PINO_REDACT_PATHS,
            censor: "[redacted]",
            remove: false,
          },
          serializers: {
            req: (request) => ({ method: request.method, url: request.routeOptions?.url ?? "unmatched" }),
            err: (error) => ({ ...errorForLog(error), message: "[redacted]", stack: "[redacted]" }),
          },
        },
    // Do not reflect arbitrary client-controlled values into response headers/logs.
    requestIdHeader: false,
    genReqId: () => randomUUID(),
    bodyLimit: 1_048_576,
    // Vercel overwrites X-Forwarded-For. The standalone API trusts its socket.
    trustProxy: onVercel,
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
    if (request.url.startsWith("/v1/admin") || request.url.startsWith("/api/auth")) {
      noStore(reply);
    }
  });

  if (onVercel) {
    app.addHook("onResponse", async (request, reply) => {
      const route = request.routeOptions.url ?? "unmatched";
      if (route === "/health" || route === "/ready") return;
      serverLog(reply.statusCode >= 500 ? "error" : "info", "http.request.completed", {
        correlationId: request.id,
        method: request.method,
        route,
        statusCode: reply.statusCode,
        durationMs: Math.round(reply.elapsedTime),
      });
    });
  }

  await registerSecurity(app, env);
  await registerHealth(app);
  await registerAuth(app);
  await registerPublicRoutes(app);
  await registerDashboardRoutes(app);
  await registerCampaignRoutes(app);
  await registerCollectionRoutes(app);
  await registerProductRoutes(app);
  await registerCatalogImportRoutes(app);
  await registerMediaRoutes(app);
  await registerSettingsRoutes(app);
  await registerLeadRoutes(app);
  await registerAuditRoutes(app);
  await registerUserRoutes(app);
  await registerHomepageRoutes(app);
  await registerNavigationRoutes(app);
  await registerAnnouncementRoutes(app);
  await registerPageRoutes(app);
  await registerRedirectRoutes(app);
  await registerPreviewRoutes(app);
  await registerRevisionRoutes(app);
  await registerTrashRoutes(app);
  await registerEventRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    return sendProblem(request, reply, error);
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      type: "https://ostoncookware.com/problems/not-found",
      title: "Rota não encontrada.",
      status: 404,
      code: "NOT_FOUND",
      instance: request.url.split("?")[0],
    });
  });

  return app;
}

export function getApp() {
  if (!appPromise) {
    appPromise = buildApp().catch((error) => {
      appPromise = null;
      throw error;
    });
  }
  return appPromise;
}
