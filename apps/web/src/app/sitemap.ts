import type { MetadataRoute } from "next";
import { getCollections, type Collection, type Product } from "@/lib/content";
import { mediaSrc } from "@/lib/api";
import { absoluteUrl, canonicalPath, isIndexingAllowed } from "@/lib/seo";
import { productImages } from "@/lib/catalog";
import { publicGet } from "@/lib/public-api";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingAllowed()) return [];
  // Uma falha de origem deve poder ser repetida; não publicar um sitemap parcial como definitivo.
  const collections = await getCollections();
  const published = collections.filter((collection) => !collection.isDemo);
  const urls: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/") },
    ...(published.length ? [{ url: absoluteUrl("/colecoes") }] : []),
    { url: absoluteUrl("/a-marca") },
    { url: absoluteUrl("/contato") },
  ];

  // Lotes curtos evitam fan-out sem limite conforme o catálogo cresce.
  for (let offset = 0; offset < published.length; offset += 6) {
    const pages = await Promise.all(published.slice(offset, offset + 6).map(async (collection) => {
      const payload = await publicGet<{ data: { collection: Collection; products: Product[] } }>(
        "/v1/public/collections/" + collection.slug,
        ["collections", "products"],
      );
      return payload.data;
    }));
    for (const { collection, products } of pages) {
      const path = "/colecoes/" + collection.slug;
      if (canonicalPath(collection.canonicalPath, path) === path) {
        urls.push({
          url: absoluteUrl(path),
          lastModified: validDate(collection.updatedAt),
          images: collection.coverImage ? [absoluteUrl(mediaSrc(collection.coverImage.url))] : undefined,
        });
      }
      for (const product of products) {
        const productPath = "/produtos/" + product.slug;
        if (product.isDemo || canonicalPath(product.canonicalPath, productPath) !== productPath) continue;
        urls.push({
          url: absoluteUrl(productPath),
          lastModified: validDate(product.updatedAt),
          images: productImages(product).map((image) => absoluteUrl(mediaSrc(image.url))),
        });
      }
    }
  }
  return [...new Map(urls.map((entry) => [entry.url, entry])).values()];
}

function validDate(value: string | Date | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
