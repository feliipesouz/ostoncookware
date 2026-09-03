import type { MetadataRoute } from "next";
import { getCollectionPage, getCollections } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let collections: { slug: string; isDemo?: boolean }[] = [];
  try {
    collections = await getCollections();
  } catch {
    collections = [];
  }

  const published = collections.filter((collection) => !collection.isDemo);
  const productUrls: MetadataRoute.Sitemap = [];

  for (const collection of published) {
    try {
      const page = await getCollectionPage(collection.slug);
      for (const product of page.products) {
        if (product.isDemo) continue;
        productUrls.push({
          url: `${site}/produtos/${product.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    } catch {
      // ignore missing collection
    }
  }

  return [
    { url: site, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${site}/colecoes`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${site}/a-marca`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${site}/contato`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ...published.map((collection) => ({
      url: `${site}/colecoes/${collection.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...productUrls,
  ];
}
