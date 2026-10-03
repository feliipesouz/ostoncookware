import { prisma } from "@oston/database";
import { unavailableResponse } from "@oston/api/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return unavailableResponse(error, "readiness");
  }
}
