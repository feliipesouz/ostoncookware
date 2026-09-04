import { dispatchApi } from "@/lib/dispatch-api";
import { previewPathFromParams, resolvePreviewAccess } from "@/lib/preview";
import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function isAdmin(request: NextRequest) {
  const response = await dispatchApi("/v1/admin/me", {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  return response.ok;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const path = previewPathFromParams({
    type: params.get("type"),
    slug: params.get("slug"),
    path: params.get("path"),
  });
  const authenticated = await isAdmin(request);
  const access = resolvePreviewAccess(authenticated, path);

  if (!access.ok) {
    return NextResponse.json(
      {
        title: access.status === 401 ? "Autenticação necessária." : "Caminho de preview não permitido.",
        status: access.status,
        code: access.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      },
      { status: access.status },
    );
  }

  const draft = await draftMode();
  draft.enable();
  return NextResponse.redirect(new URL(access.path, request.url));
}
