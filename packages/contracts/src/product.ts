import { z } from "zod";
import { expectedVersionSchema, mediaSummarySchema, moneySchema, seoFieldsSchema, slugSchema } from "./common.js";
import { contentStatusSchema, productAvailabilitySchema } from "./enums.js";

export const namedValueSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(240),
});

export const productDimensionsSchema = z
  .object({
    diameterCm: z.number().positive().optional(),
    heightCm: z.number().positive().optional(),
    widthCm: z.number().positive().optional(),
    lengthCm: z.number().positive().optional(),
    capacityL: z.number().positive().optional(),
    weightKg: z.number().positive().optional(),
  })
  .strict();

export const productDetailsSchema = z
  .object({
    dimensions: productDimensionsSchema.optional(),
    materials: z.array(z.string().min(1).max(120)).max(20).default([]),
    compatibilities: z.array(z.string().min(1).max(80)).max(20).default([]),
    care: z.array(z.string().min(1).max(240)).max(20).default([]),
  })
  .strict();

export const productVariantWriteSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1).max(120),
    sku: z.string().max(64).nullable().optional(),
    attributes: z.record(z.string(), z.string()).default({}),
    price: moneySchema.optional(),
    availability: productAvailabilitySchema.default("AVAILABLE"),
    sortOrder: z.number().int().min(0).default(0),
    status: contentStatusSchema.default("DRAFT"),
  })
  .strict();

export const productVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  attributes: z.record(z.string(), z.unknown()),
  price: z.string().nullable(),
  availability: productAvailabilitySchema,
  sortOrder: z.number().int(),
  status: contentStatusSchema,
});

export const productWriteSchema = z
  .object({
    collectionId: z.string().min(1),
    name: z.string().min(2).max(160),
    slug: slugSchema,
    sku: z.string().max(64).nullable().optional(),
    shortDescription: z.string().max(240).nullable().optional(),
    description: z.string().max(8000).nullable().optional(),
    imageIds: z.array(z.string()).max(24).default([]),
    specifications: z.array(namedValueSchema).max(40).default([]),
    features: z.array(z.string().min(1).max(240)).max(40).default([]),
    itemsIncluded: z.array(z.string().min(1).max(240)).max(80).default([]),
    details: productDetailsSchema.optional(),
    variants: z.array(productVariantWriteSchema).max(40).optional(),
    price: moneySchema.optional(),
    availability: productAvailabilitySchema.default("AVAILABLE"),
    featured: z.boolean().default(false),
    status: contentStatusSchema.default("DRAFT"),
    sortOrder: z.number().int().min(0).default(0),
    isDemo: z.boolean().default(false),
    expectedVersion: expectedVersionSchema,
    ...seoFieldsSchema.shape,
  })
  .strict();

export const productSummarySchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  collectionSlug: z.string().optional(),
  collectionName: z.string().optional(),
  name: z.string(),
  slug: z.string(),
  sku: z.string().nullable(),
  shortDescription: z.string().nullable(),
  coverImage: mediaSummarySchema.nullable(),
  price: z.string().nullable(),
  availability: productAvailabilitySchema,
  featured: z.boolean(),
  status: contentStatusSchema,
  sortOrder: z.number().int(),
  isDemo: z.boolean(),
  version: z.number().int(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const productSchema = productSummarySchema.extend({
  description: z.string().nullable(),
  images: z.array(mediaSummarySchema),
  specifications: z.array(namedValueSchema),
  features: z.array(z.string()),
  itemsIncluded: z.array(z.string()),
  details: productDetailsSchema,
  variants: z.array(productVariantSchema),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  ogImage: mediaSummarySchema.nullable(),
  canonicalPath: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const productBulkActionSchema = z.enum(["PUBLISH", "ARCHIVE", "FEATURE", "UNFEATURE", "EXPORT"]);

export const productBulkSchema = z
  .object({
    ids: z.array(z.string().min(1).max(64)).min(1).max(100),
    action: z
      .enum([
        "PUBLISH",
        "ARCHIVE",
        "FEATURE",
        "UNFEATURE",
        "EXPORT",
        "publish",
        "archive",
        "feature",
        "unfeature",
        "export",
      ])
      .transform((value) => value.toUpperCase() as z.infer<typeof productBulkActionSchema>),
  })
  .strict();

export const productImportRequestSchema = z
  .object({
    csv: z.string().min(1).max(1_000_000),
  })
  .strict();

export const PRODUCT_CSV_COLUMNS = [
  "sku",
  "slug",
  "name",
  "collectionSlug",
  "shortDescription",
  "description",
  "price",
  "availability",
  "status",
  "featured",
  "seoTitle",
  "seoDescription",
] as const;

export type ProductWrite = z.infer<typeof productWriteSchema>;
export type ProductSummary = z.infer<typeof productSummarySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductBulk = z.infer<typeof productBulkSchema>;
export type ProductDetails = z.infer<typeof productDetailsSchema>;
export type ProductVariantWrite = z.infer<typeof productVariantWriteSchema>;
