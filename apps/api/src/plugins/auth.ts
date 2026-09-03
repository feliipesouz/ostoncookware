import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { loadEnv } from "../config/env.js";
import { noStore } from "../lib/http.js";
import { auth } from "../modules/auth/infrastructure/auth.js";

const GENERIC_SIGN_IN_ERROR = "E-mail ou senha inválidos.";

function authRequestUrl(request: FastifyRequest) {
  const env = loadEnv();
  return new URL(request.url, env.BETTER_AUTH_URL);
}

function isSignInPath(url: string) {
  return url.includes("/sign-in/email");
}

export async function registerAuth(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute",
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      noStore(reply);
      const headers = fromNodeHeaders(request.headers);
      const url = authRequestUrl(request);
      const hasBody = request.method !== "GET" && request.method !== "HEAD" && request.body !== undefined;

      const response = await auth.handler(
        new Request(url.toString(), {
          method: request.method,
          headers,
          body: hasBody ? JSON.stringify(request.body) : undefined,
        }),
      );

      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
          return;
        }
        reply.header(key, value);
      });

      const setCookies = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];
      if (setCookies.length > 0) {
        reply.header("set-cookie", setCookies);
      }

      const text = await response.text();
      if (isSignInPath(request.url) && response.status >= 400 && text.length > 0) {
        try {
          const payload = JSON.parse(text) as { message?: string; code?: string };
          return reply.send({
            ...payload,
            message: GENERIC_SIGN_IN_ERROR,
          });
        } catch {
          return reply.send({ message: GENERIC_SIGN_IN_ERROR });
        }
      }

      return reply.send(text.length > 0 ? text : null);
    },
  });

  app.get("/v1/admin/me", async (request, reply) => {
    noStore(reply);
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user) {
      return reply.status(401).send({
        type: "https://ostoncookware.com/problems/unauthorized",
        title: "Autenticação necessária.",
        status: 401,
        code: "UNAUTHORIZED",
      });
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: "role" in session.user ? session.user.role : "EDITOR",
    };
  });
}
