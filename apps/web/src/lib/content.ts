import { defaultFooterNavigation, defaultHeaderNavigation, defaultHomepageSections } from "@/lib/cms-defaults";
import type { HomepageSection } from "@oston/contracts";
import type { NavigationItem } from "@oston/contracts";
import { draftMode } from "next/headers";

export type Media = {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

export type Campaign = {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  desktopImage: Media | null;
  mobileImage: Media | null;
  video: Media | null;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  textAlign: "left" | "center" | "right";
  focalPosition: string;
  overlay: number;
  collectionId: string | null;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  coverImage: Media | null;
  gallery: Media[];
  featured: boolean;
  isDemo: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type Product = {
  id: string;
  collectionId: string;
  collectionSlug?: string;
  collectionName?: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  coverImage: Media | null;
  images: Media[];
  specifications: { label: string; value: string }[];
  features: string[];
  itemsIncluded: string[];
  availability: string;
  isDemo: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type Settings = {
  brandName: string;
  tagline: string | null;
  whatsapp: string | null;
  whatsappMessage: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  addressLine: string | null;
  addressCity: string | null;
  addressState: string | null;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImage: Media | null;
  footerText: string | null;
  copyrightText: string | null;
  favicon: Media | null;
  catalogPdf: Media | null;
  businessHours: string | null;
  privacyPolicyUrl: string | null;
  termsUrl: string | null;
};

export type Announcement = {
  id: string;
  message: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

export type InstitutionalPage = {
  id?: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PublicHomepageSection = HomepageSection & { image?: Media | null };

export type PublicSite = {
  settings: Settings;
  campaign: Campaign | null;
  collections: Collection[];
  homepage: { sections: PublicHomepageSection[]; version?: number };
  navigation: { header: NavigationItem[]; footer: NavigationItem[] };
  announcement: Announcement | null;
  pages: { slug: string; title: string; eyebrow: string | null }[];
};

export type { HomepageSection, NavigationItem };

export async function isDraftEnabled() {
  try {
    const draft = await draftMode();
    return draft.isEnabled;
  } catch {
    return false;
  }
}

async function previewGet<T>(path: string): Promise<T> {
  const { adminFetch } = await import("@/lib/admin");
  const response = await adminFetch(path, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Preview GET ${path} failed`);
  }
  return response.json() as Promise<T>;
}

async function loadPublicGet() {
  const { publicGet } = await import("./public-api");
  return publicGet;
}

export async function getPublicSite() {
  if (await isDraftEnabled()) {
    try {
      const payload = await previewGet<{ data: PublicSite }>("/v1/admin/preview/site");
      return payload.data;
    } catch {
      const publicGet = await loadPublicGet();
      const payload = await publicGet<{ data: PublicSite }>(
        "/v1/public/site",
        ["site", "campaigns", "collections", "settings", "homepage", "navigation", "announcements", "pages"],
      );
      return payload.data;
    }
  }

  const publicGet = await loadPublicGet();
  const payload = await publicGet<{ data: PublicSite }>(
    "/v1/public/site",
    ["site", "campaigns", "collections", "settings", "homepage", "navigation", "announcements", "pages"],
  );
  return payload.data;
}

export function fallbackSettings(): Settings {
  return {
    brandName: "OSTON Cookware",
    tagline: "Cozinhando com qualidade e estilo",
    whatsapp: null,
    whatsappMessage: null,
    phone: null,
    email: "contato@ostoncookware.com",
    instagram: null,
    facebook: null,
    youtube: null,
    addressLine: null,
    addressCity: null,
    addressState: null,
    defaultSeoTitle: "OSTON Cookware",
    defaultSeoDescription: "Cozinhando com qualidade e estilo.",
    defaultOgImage: null,
    footerText: "Cookware contemporâneo, atendimento consultivo e uma presença digital pensada para durar.",
    copyrightText: "OSTON Cookware.",
    favicon: null,
    catalogPdf: null,
    businessHours: null,
    privacyPolicyUrl: null,
    termsUrl: null,
  };
}

export function fallbackCampaign(): Campaign {
  return {
    id: "fallback",
    eyebrow: "OSTON Cookware",
    title: "Cozinhando com qualidade e estilo",
    subtitle:
      "Uma marca brasileira de cookware contemporâneo. Campanha, embaixador e coleções são gerenciados no CMS.",
    desktopImage: {
      id: "d",
      url: "/demo/hero-desktop.png",
      alt: "Hero DEMO",
      width: 2400,
      height: 1500,
    },
    mobileImage: {
      id: "m",
      url: "/demo/hero-mobile.png",
      alt: "Hero DEMO mobile",
      width: 1200,
      height: 1800,
    },
    video: null,
    imageAlt: "Campanha inicial OSTON",
    primaryCtaLabel: "Conhecer coleções",
    primaryCtaUrl: "/colecoes",
    secondaryCtaLabel: "Falar com consultor",
    secondaryCtaUrl: "/contato",
    textAlign: "left",
    focalPosition: "center",
    overlay: 46,
    collectionId: null,
  };
}

export function fallbackSite(): PublicSite {
  return {
    settings: fallbackSettings(),
    campaign: fallbackCampaign(),
    collections: [],
    homepage: { sections: defaultHomepageSections, version: 1 },
    navigation: { header: defaultHeaderNavigation, footer: defaultFooterNavigation },
    announcement: null,
    pages: [],
  };
}

export async function getPublicSiteSafe() {
  try {
    const site = await getPublicSite();
    return {
      ...fallbackSite(),
      ...site,
      settings: { ...fallbackSettings(), ...site.settings },
      homepage: site.homepage?.sections?.length
        ? site.homepage
        : { sections: defaultHomepageSections, version: 1 },
      navigation: {
        header: site.navigation?.header?.length ? site.navigation.header : defaultHeaderNavigation,
        footer: site.navigation?.footer?.length ? site.navigation.footer : defaultFooterNavigation,
      },
    } satisfies PublicSite;
  } catch {
    return fallbackSite();
  }
}

export async function getCollections() {
  const publicGet = await loadPublicGet();
  const payload = await publicGet<{ data: Collection[] }>("/v1/public/collections", [
    "collections",
  ]);
  return payload.data;
}

export async function getCollectionPage(slug: string) {
  if (await isDraftEnabled()) {
    try {
      const payload = await previewGet<{ data: { collection: Collection; products: Product[] } }>(
        `/v1/admin/preview/collections/${slug}`,
      );
      return payload.data;
    } catch {
      // fall through to public
    }
  }
  const publicGet = await loadPublicGet();
  const payload = await publicGet<{ data: { collection: Collection; products: Product[] } }>(
    `/v1/public/collections/${slug}`,
    ["collections", "products"],
  );
  return payload.data;
}

export async function getProduct(slug: string) {
  if (await isDraftEnabled()) {
    try {
      const payload = await previewGet<{ data: Product }>(`/v1/admin/preview/products/${slug}`);
      return payload.data;
    } catch {
      // fall through to public
    }
  }
  const publicGet = await loadPublicGet();
  const payload = await publicGet<{ data: Product }>(`/v1/public/products/${slug}`, ["products"]);
  return payload.data;
}

export async function getInstitutionalPage(slug: string) {
  if (await isDraftEnabled()) {
    try {
      const payload = await previewGet<{ data: InstitutionalPage }>(`/v1/admin/preview/pages/${slug}`);
      return payload.data;
    } catch {
      // fall through to public
    }
  }
  const publicGet = await loadPublicGet();
  const payload = await publicGet<{ data: InstitutionalPage }>(`/v1/public/pages/${slug}`, ["pages"]);
  return payload.data;
}

export function pageParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function consultantMessage(settings: Settings, fallback: string) {
  return settings.whatsappMessage?.trim() || fallback;
}
