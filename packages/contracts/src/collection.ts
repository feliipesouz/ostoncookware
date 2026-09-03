import { z } from "zod";
import { expectedVersionSchema, mediaSummarySchema, moneySchema, seoFieldsSchema, slugSchema } from "./common.js";
import { contentStatusSchema } from "./enums.js";

export const collectionWriteSchema = z
  .object({
    name: z.string().min(2).max(120),
    slug: slugSchema,
    shortDescription: z.string().max(240).nullable().optional(),
    description: z.string().max(8000).nullable().optional(),
    coverImageId: z.string().nullable().optional(),
    galleryIds: z.array(z.string()).max(24).default([]),
    priceFrom: moneySchema.optional(),
    featured: z.boolean().default(false),
    status: contentStatusSchema.default("DRAFT"),
    sortOrder: z.number().int().min(0).default(0),
    isDemo: z.boolean().default(false),
    expectedVersion: expectedVersionSchema,
    ...seoFieldsSchema.shape,
  })
  .strict();

export const collectionSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string().nullable(),
  coverImage: mediaSummarySchema.nullable(),
  priceFrom: z.string().nullable(),
  featured: z.boolean(),
  status: contentStatusSchema,
  sortOrder: z.number().int(),
  isDemo: z.boolean(),
  version: z.number().int(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const collectionSchema = collectionSummarySchema.extend({
  description: z.string().nullable(),
  gallery: z.array(mediaSummarySchema),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  ogImage: mediaSummarySchema.nullable(),
  canonicalPath: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CollectionWrite = z.infer<typeof collectionWriteSchema>;
export type CollectionSummary = z.infer<typeof collectionSummarySchema>;
export type Collection = z.infer<typeof collectionSchema>;
