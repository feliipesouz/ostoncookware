import { handleApiRoute } from "@/lib/dispatch-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return handleApiRoute(request);
}
