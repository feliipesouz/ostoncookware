import { randomUUID } from "node:crypto";
import { serverLog } from "./logging.js";

export function unavailableResponse(error: unknown, scope: "api" | "auth" | "readiness"): Response {
  const correlationId = randomUUID();
  serverLog("error", `${scope}.unavailable`, { correlationId, error });

  return Response.json({
    type: "https://ostoncookware.com/problems/unavailable",
    title: "Serviço temporariamente indisponível. Tente novamente.",
    status: 503,
    code: "SERVICE_UNAVAILABLE",
    correlationId,
  }, {
    status: 503,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Request-Id": correlationId,
      "Content-Type": "application/problem+json",
    },
  });
}
