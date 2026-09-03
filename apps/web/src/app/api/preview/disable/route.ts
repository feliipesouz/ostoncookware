import { resolvePreviewDisablePath } from "@/lib/preview";
import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const draft = await draftMode();
  draft.disable();
  const path = resolvePreviewDisablePath(request.nextUrl.searchParams.get("returnTo"));
  return NextResponse.redirect(new URL(path, request.url));
}
