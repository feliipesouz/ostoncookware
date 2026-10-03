import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexingAllowed, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingAllowed()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/v1/", "/health", "/ready"],
    }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
