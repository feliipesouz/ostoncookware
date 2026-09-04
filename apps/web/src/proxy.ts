import { NextRequest, NextResponse } from "next/server";
import { apiOrigin } from "@/lib/api-origin";
import { isSkippableRedirectPath, lookupPublicRedirect } from "@/lib/redirect-lookup";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const api = apiOrigin(request);

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const response = await fetch(`${api}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const session = (await response.json()) as { user?: unknown } | null;
    if (!session?.user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const next = NextResponse.next();
    next.headers.set("Cache-Control", "no-store, private");
    next.headers.set("X-Robots-Tag", "noindex, nofollow");
    return next;
  }

  if (isSkippableRedirectPath(pathname)) {
    return NextResponse.next();
  }

  const match = await lookupPublicRedirect(pathname, api);
  if (match) {
    const destination = match.destination.startsWith("http")
      ? match.destination
      : new URL(match.destination, request.url).toString();
    if (new URL(destination, request.url).pathname.startsWith("/admin")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(destination, match.statusCode);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|demo/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
