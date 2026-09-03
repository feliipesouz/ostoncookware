import { z } from "zod";
import { mediaSummarySchema } from "./common.js";
import { isSafeCtaUrl } from "./url.js";

const emptyToNull = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value.trim().length === 0) return null;
    return value.trim();
  });

const optionalEmail = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value.trim().length === 0) return null;
    return value.trim();
  })
  .refine((value) => value === undefined || value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "E-mail inválido.");

const optionalHttpUrl = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value.trim().length === 0) return null;
    return value.trim();
  })
  .refine((value) => value === undefined || value === null || isSafeCtaUrl(value), "URL inválida. Use apenas http(s).");

export const siteSettingsWriteSchema = z
  .object({
    brandName: z.string().min(2).max(80),
    tagline: emptyToNull,
    logoId: emptyToNull,
    logoInverseId: emptyToNull,
    faviconId: emptyToNull,
    whatsapp: emptyToNull,
    phone: emptyToNull,
    email: optionalEmail,
    instagram: optionalHttpUrl,
    facebook: optionalHttpUrl,
    youtube: optionalHttpUrl,
    addressLine: emptyToNull,
    addressCity: emptyToNull,
    addressState: emptyToNull,
    defaultSeoTitle: z.string().max(70),
    defaultSeoDescription: z.string().max(320),
    defaultOgImageId: emptyToNull,
    footerText: emptyToNull,
    copyrightText: emptyToNull,
    catalogPdfId: emptyToNull,
    whatsappMessage: emptyToNull,
    businessHours: emptyToNull,
    privacyPolicyUrl: optionalHttpUrl,
    termsUrl: optionalHttpUrl,
    vercelAnalyticsId: emptyToNull,
    gtmId: emptyToNull,
    gaId: emptyToNull,
  })
  .strict();

export const siteSettingsSchema = z.object({
  id: z.string(),
  brandName: z.string(),
  tagline: z.string().nullable(),
  logoId: z.string().nullable().optional(),
  logoInverseId: z.string().nullable().optional(),
  faviconId: z.string().nullable().optional(),
  whatsapp: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  instagram: z.string().nullable(),
  facebook: z.string().nullable(),
  youtube: z.string().nullable(),
  addressLine: z.string().nullable(),
  addressCity: z.string().nullable(),
  addressState: z.string().nullable(),
  defaultSeoTitle: z.string(),
  defaultSeoDescription: z.string(),
  defaultOgImageId: z.string().nullable().optional(),
  footerText: z.string().nullable(),
  copyrightText: z.string().nullable(),
  catalogPdfId: z.string().nullable().optional(),
  whatsappMessage: z.string().nullable().optional(),
  businessHours: z.string().nullable().optional(),
  privacyPolicyUrl: z.string().nullable().optional(),
  termsUrl: z.string().nullable().optional(),
  vercelAnalyticsId: z.string().nullable(),
  gtmId: z.string().nullable(),
  gaId: z.string().nullable(),
  logo: mediaSummarySchema.nullable(),
  logoInverse: mediaSummarySchema.nullable(),
  favicon: mediaSummarySchema.nullable(),
  defaultOgImage: mediaSummarySchema.nullable(),
  catalogPdf: mediaSummarySchema.nullable(),
  updatedAt: z.coerce.date(),
});

export type SiteSettingsWrite = z.infer<typeof siteSettingsWriteSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
