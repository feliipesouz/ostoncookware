import { CAMPAIGN_PREVIEW_COOKIE, resolvePreviewDisablePath } from "@/lib/preview";
import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const draft = await draftMode();
  draft.disable();
  const path = resolvePreviewDisablePath(request.nextUrl.searchParams.get("returnTo"));
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete(CAMPAIGN_PREVIEW_COOKIE);
  return response;
}
