import "server-only";

import { handleWebRequest } from "@oston/api/handler";
import { unavailableResponse } from "@oston/api/runtime";

export async function dispatchApi(path: string, init: RequestInit = {}) {
  return handleWebRequest(new Request(new URL(path, "http://oston.internal"), init));
}

export async function handleApiRoute(request: Request) {
  try {
    return await handleWebRequest(request);
  } catch (error) {
    return unavailableResponse(error, "api");
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
