import { getAuth } from "@oston/api/auth";
import { publicRuntimeError } from "@/lib/runtime-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleAuth(request: Request) {
  try {
    return await getAuth().handler(request);
  } catch (error) {
    console.error("[oston-auth]", error);
    return Response.json(
      { status: "error", runtime: "auth", message: publicRuntimeError(error) },
      { status: 503 },
    );
  }
}

export const GET = handleAuth;
export const POST = handleAuth;
export const PUT = handleAuth;
export const PATCH = handleAuth;
export const DELETE = handleAuth;
export const HEAD = handleAuth;
export const OPTIONS = handleAuth;
