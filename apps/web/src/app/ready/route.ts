import { handleWebRequest } from "@oston/api/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeMessage(error: unknown) {
  const raw =
    error instanceof Error
      ? `${error.name}: ${error.message}${
          error.cause instanceof Error ? ` (${error.cause.message})` : ""
        }`
      : String(error);
  return raw.replace(/[a-z][a-z0-9+.-]*:\/\/[^\s"'\\]+/gi, "[redacted]");
}

export async function GET() {
  try {
    return await handleWebRequest(new Request("http://oston.internal/ready"));
  } catch (error) {
    console.error("[oston-api] /ready", error);
    return Response.json({ status: "error", message: safeMessage(error) }, { status: 503 });
  }
}
