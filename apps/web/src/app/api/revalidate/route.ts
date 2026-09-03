import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const ALLOWED_TAGS = new Set([
  "site",
  "campaigns",
  "collections",
  "products",
  "settings",
  "homepage",
  "navigation",
  "pages",
  "announcements",
]);

function secretsEqual(provided: string, expected: string) {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATION_SECRET;
  const secret = request.headers.get("x-revalidation-secret") ?? "";
  if (!expected || !secretsEqual(secret, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const requested = Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : ["site"];
  const tags = [...new Set(requested.filter((tag) => ALLOWED_TAGS.has(tag)))];

  if (tags.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid_tags" }, { status: 400 });
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ ok: true, tags });
}
