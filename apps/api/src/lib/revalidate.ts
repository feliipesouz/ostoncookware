import { loadEnv } from "../config/env.js";
import { serverLog } from "./logging.js";

export const REVALIDATE_TAGS = [
  "site",
  "campaigns",
  "collections",
  "products",
  "settings",
  "homepage",
  "navigation",
  "pages",
  "announcements",
] as const;
export type RevalidateTag = (typeof REVALIDATE_TAGS)[number];

export function filterRevalidateTags(tags: string[]) {
  const allowed = new Set<string>(REVALIDATE_TAGS);
  return [...new Set(tags.filter((tag) => allowed.has(tag)))];
}

export async function revalidateSite(tags: string[]) {
  const env = loadEnv();
  const uniqueTags = filterRevalidateTags(tags);
  if (uniqueTags.length === 0) {
    return;
  }

  await Promise.all(
    env.webOrigins.map(async (origin) => {
      try {
        const response = await fetch(`${origin}/api/revalidate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidation-secret": env.REVALIDATION_SECRET,
          },
          body: JSON.stringify({ tags: uniqueTags }),
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) {
          serverLog("warn", "cache.revalidation.rejected", {
            origin,
            tags: uniqueTags,
            statusCode: response.status,
          });
        }
      } catch (error) {
        serverLog("warn", "cache.revalidation.failed", { origin, tags: uniqueTags, error });
      }
    }),
  );
}
