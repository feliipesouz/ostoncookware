import { dispatchApi } from "@/lib/dispatch-api";
import { CAMPAIGN_PREVIEW_COOKIE, parseCampaignPreviewId, previewPathFromParams, resolvePreviewAccess } from "@/lib/preview";
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

  const isCampaign = params.get("type") === "campaign";
  const campaignId = isCampaign ? parseCampaignPreviewId(params.get("id")) : null;
  if (isCampaign && !campaignId) {
    return NextResponse.json({ title: "Campanha de preview inválida.", status: 400 }, { status: 400 });
  }
  if (campaignId) {
    const campaign = await dispatchApi(`/v1/admin/preview/campaigns/${campaignId}`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    if (!campaign.ok) {
      return NextResponse.json({ title: "Não foi possível visualizar esta campanha.", status: campaign.status }, { status: campaign.status });
    }
  }

  const draft = await draftMode();
  draft.enable();
  const response = NextResponse.redirect(new URL(access.path, request.url));
  if (campaignId) {
    response.cookies.set(CAMPAIGN_PREVIEW_COOKIE, campaignId, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 3600,
    });
  } else {
    response.cookies.delete(CAMPAIGN_PREVIEW_COOKIE);
  }
  return response;
}
