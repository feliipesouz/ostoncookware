import type { Metadata } from "next";
import type { Product, Settings } from "./content";
import { mediaSrc } from "./api";
import { CATALOG_CURRENCY, catalogPrice, productImages } from "./catalog";

export function siteUrl() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
    if (!["http:", "https:"].includes(url.protocol)) return "http://localhost:3000";
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl()).toString();
}

export function isIndexingAllowed() {
  const host = new URL(siteUrl()).hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  const preview = Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");
  return process.env.NODE_ENV === "production" && !preview && !local;
}

export function canonicalPath(path: string | null | undefined, fallback: string) {
  return path && /^\/[a-zA-Z0-9/_-]*$/.test(path) && !path.startsWith("//")
    ? path
    : fallback;
}

export function siteMetadata(settings: Settings, input?: {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  noindex?: boolean;
}): Metadata {
  const title = input?.title?.trim() || settings.defaultSeoTitle;
  const description = input?.description?.trim() || settings.defaultSeoDescription;
  const fullTitle = title.toLowerCase().includes(settings.brandName.toLowerCase())
    ? title
    : title + " · " + settings.brandName;
  const url = absoluteUrl(canonicalPath(input?.path, "/"));
  const source = input?.image || settings.defaultOgImage?.url;
  const image = source ? absoluteUrl(mediaSrc(source)) : undefined;
  const index = isIndexingAllowed() && !input?.noindex;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      siteName: settings.brandName,
      title: fullTitle,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      images: image ? [image] : undefined,
    },
    robots: { index, follow: !input?.noindex, ...(!index ? { nocache: true } : {}) },
  };
}

export function breadcrumbData(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productData(product: Product, settings: Settings) {
  const price = catalogPrice(product.price);
  // Sem preço publicado não há oferta nem avaliações inventadas para completar o schema.
  if (product.isDemo || price === null || product.availability !== "AVAILABLE") return null;
  const url = absoluteUrl(canonicalPath(product.canonicalPath, "/produtos/" + product.slug));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url + "#product",
    name: product.name,
    description: product.shortDescription || product.description || undefined,
    image: productImages(product).map((image) => absoluteUrl(mediaSrc(image.url))),
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: settings.brandName },
    url,
    additionalProperty: product.specifications.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label,
      value: spec.value,
    })),
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: CATALOG_CURRENCY,
      url,
      seller: { "@type": "Organization", name: settings.brandName },
    },
  };
}

export function jsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
