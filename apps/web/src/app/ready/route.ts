import { prisma } from "@oston/database";
import { publicRuntimeError } from "@/lib/runtime-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ready", runtime: "prisma" });
  } catch (error) {
    console.error("[oston-ready]", error);
    return Response.json(
      { status: "error", runtime: "prisma", message: publicRuntimeError(error) },
      { status: 503 },
    );
  }
}
