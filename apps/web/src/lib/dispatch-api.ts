import "server-only";

import { handleWebRequest } from "@oston/api/handler";

export async function dispatchApi(path: string, init: RequestInit = {}) {
  return handleWebRequest(new Request(new URL(path, "http://oston.internal"), init));
}

function publicApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "API unavailable";
  return message.replace(/[a-z][a-z0-9+.-]*:\/\/[^\s"'\\]+/gi, "[redacted]");
}

export async function handleApiRoute(request: Request) {
  try {
    return await handleWebRequest(request);
  } catch (error) {
    const message = publicApiError(error);
    console.error("[oston-api]", message);
    return Response.json({ status: "error", message }, { status: 503 });
  }
}

export const apiRouteHandlers = {
  GET: handleApiRoute,
  POST: handleApiRoute,
  PUT: handleApiRoute,
  PATCH: handleApiRoute,
  DELETE: handleApiRoute,
  HEAD: handleApiRoute,
  OPTIONS: handleApiRoute,
};
