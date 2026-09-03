import { Prisma, prisma } from "@oston/database";
import { siteSettingsWriteSchema, type SiteSettingsWrite } from "@oston/contracts";
import { toMediaSummary } from "../../../lib/media.js";

const include = {
  logo: true,
  logoInverse: true,
  favicon: true,
  defaultOgImage: true,
  catalogPdf: true,
} as const;

type SettingsRow = Prisma.SiteSettingsGetPayload<{ include: typeof include }>;

function extraSettings(row: SettingsRow) {
  return {
    whatsappMessage: row.whatsappMessage ?? null,
    businessHours: row.businessHours ?? null,
    privacyPolicyUrl: row.privacyPolicyUrl ?? null,
    termsUrl: row.termsUrl ?? null,
  };
}

function mapSettings(row: SettingsRow) {
  return {
    id: row.id,
    brandName: row.brandName,
    tagline: row.tagline,
    logoId: row.logoId,
    logoInverseId: row.logoInverseId,
    faviconId: row.faviconId,
    whatsapp: row.whatsapp,
    phone: row.phone,
    email: row.email,
    instagram: row.instagram,
    facebook: row.facebook,
    youtube: row.youtube,
    addressLine: row.addressLine,
    addressCity: row.addressCity,
    addressState: row.addressState,
    defaultSeoTitle: row.defaultSeoTitle,
    defaultSeoDescription: row.defaultSeoDescription,
    defaultOgImageId: row.defaultOgImageId,
    footerText: row.footerText,
    copyrightText: row.copyrightText,
    catalogPdfId: row.catalogPdfId,
    ...extraSettings(row),
    vercelAnalyticsId: row.vercelAnalyticsId,
    gtmId: row.gtmId,
    gaId: row.gaId,
    logo: toMediaSummary(row.logo),
    logoInverse: toMediaSummary(row.logoInverse),
    favicon: toMediaSummary(row.favicon),
    defaultOgImage: toMediaSummary(row.defaultOgImage),
    catalogPdf: toMediaSummary(row.catalogPdf),
    updatedAt: row.updatedAt,
  };
}

export async function getSettings() {
  const row = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    include,
  });

  if (!row) {
    return mapSettings(
      await prisma.siteSettings.create({
        data: {
          id: "default",
          brandName: "OSTON Cookware",
          defaultSeoTitle: "OSTON Cookware",
          defaultSeoDescription: "Cookware premium contemporâneo.",
        },
        include,
      }),
    );
  }

  return mapSettings(row);
}

export async function updateSettings(input: SiteSettingsWrite) {
  const parsed = siteSettingsWriteSchema.parse(input);
  const data = Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => value !== undefined),
  );
  const row = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      brandName: parsed.brandName,
      defaultSeoTitle: parsed.defaultSeoTitle,
      defaultSeoDescription: parsed.defaultSeoDescription,
      ...data,
    },
    update: data,
    include,
  });
  return mapSettings(row);
}
