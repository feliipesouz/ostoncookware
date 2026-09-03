import type { Metadata } from "next";
import type { Settings } from "./content";
import { mediaSrc } from "./api";

export function siteMetadata(settings: Settings, input?: {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = input?.title ?? settings.defaultSeoTitle;
  const description = input?.description ?? settings.defaultSeoDescription;
  const url = `${siteUrl}${input?.path ?? "/"}`;
  const image = input?.image
    ? mediaSrc(input.image)
    : settings.defaultOgImage
      ? mediaSrc(settings.defaultOgImage.url)
      : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      siteName: settings.brandName,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function jsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
