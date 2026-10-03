import { getAuth } from "@oston/api/auth";
import { unavailableResponse } from "@oston/api/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleAuth(request: Request) {
  try {
    const response = await getAuth().handler(request);
    response.headers.set("Cache-Control", "no-store, private");
    return response;
  } catch (error) {
    return unavailableResponse(error, "auth");
  }
}

export const GET = handleAuth;
export const POST = handleAuth;
export const PUT = handleAuth;
export const PATCH = handleAuth;
export const DELETE = handleAuth;
export const HEAD = handleAuth;
export const OPTIONS = handleAuth;
