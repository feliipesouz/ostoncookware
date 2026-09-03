import { z } from "zod";
import { moneySchema, slugSchema } from "./common.js";
import { contentStatusSchema, leadInterestSchema, leadStatusSchema, productAvailabilitySchema } from "./enums.js";

const csvBoolean = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0", "sim", "nao", "não"])])
  .transform((value) => value === true || value === "true" || value === "1" || value === "sim");

export const collectionImportRowSchema = z
  .object({
    name: z.string().min(2).max(120),
    slug: slugSchema,
    shortDescription: z.string().max(240).optional(),
    description: z.string().max(8000).optional(),
    status: contentStatusSchema.optional(),
    featured: csvBoolean.optional(),
    priceFrom: moneySchema.optional(),
  })
  .strict();

export const productImportRowSchema = z
  .object({
    name: z.string().min(2).max(160),
    slug: slugSchema,
    collectionSlug: slugSchema,
    sku: z.string().max(64).optional(),
    shortDescription: z.string().max(240).optional(),
    description: z.string().max(8000).optional(),
    price: moneySchema.optional(),
    availability: productAvailabilitySchema.optional(),
    status: contentStatusSchema.optional(),
    featured: csvBoolean.optional(),
    materials: z.string().max(500).optional(),
    compatibilities: z.string().max(500).optional(),
    care: z.string().max(500).optional(),
  })
  .strict();

export const leadImportRowSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(254).optional(),
    phone: z.string().min(8).max(32),
    city: z.string().max(80).optional(),
    state: z.string().max(40).optional(),
    interest: leadInterestSchema.optional(),
    status: leadStatusSchema.optional(),
    message: z.string().max(2000).optional(),
    source: z.string().max(80).optional(),
    tags: z.string().max(400).optional(),
  })
  .strict();

export const redirectImportRowSchema = z
  .object({
    sourcePath: z.string().min(1).max(240),
    destination: z.string().min(1).max(500),
    statusCode: z.coerce.number().int().optional(),
    active: csvBoolean.optional(),
  })
  .strict();

export type CollectionImportRow = z.infer<typeof collectionImportRowSchema>;
export type ProductImportRow = z.infer<typeof productImportRowSchema>;
export type LeadImportRow = z.infer<typeof leadImportRowSchema>;
export type RedirectImportRow = z.infer<typeof redirectImportRowSchema>;
