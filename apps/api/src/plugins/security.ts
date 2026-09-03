import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import type { Env } from "../config/env.js";

export async function registerSecurity(app: FastifyInstance, env: Env) {
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    hsts: env.isProduction
      ? { maxAge: 15552000, includeSubDomains: true, preload: false }
      : false,
    referrerPolicy: { policy: "no-referrer" },
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.webOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-Id"],
    maxAge: 86400,
  });

  // Camada adicional in-memory por instância. A proteção principal de login/leads
  // é persistente (Better Auth database rate limit + tabela throttle).
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    allowList: (request) => request.url === "/health" || request.url === "/ready",
  });
}
