import { z } from "zod";
import { mediaTypeSchema } from "./enums.js";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const ALLOWED_DOCUMENT_MIME_TYPES = ["application/pdf"] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export const mediaCompleteSchema = z
  .object({
    url: z.string().url(),
    pathname: z.string().min(1).max(500),
    originalFilename: z.string().min(1).max(255),
    alt: z.string().max(180).nullable().optional(),
    mimeType: z.string().min(1).max(120),
    size: z.number().int().min(1).max(MAX_VIDEO_BYTES),
    width: z.number().int().positive().max(12_000).nullable().optional(),
    height: z.number().int().positive().max(12_000).nullable().optional(),
    type: mediaTypeSchema,
  })
  .strict();

export const mediaAssetSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  pathname: z.string(),
  originalFilename: z.string(),
  alt: z.string().nullable(),
  mimeType: z.string(),
  size: z.number().int(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  type: mediaTypeSchema,
  createdById: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const mediaUpdateSchema = z
  .object({
    alt: z.string().max(180).nullable().optional(),
    focalX: z.number().min(0).max(1).nullable().optional(),
    focalY: z.number().min(0).max(1).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  })
  .strict();

export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(200).optional(),
  type: mediaTypeSchema.optional(),
  missingAlt: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
  tags: z.string().max(200).optional(),
});

export const mediaUploadTokenRequestSchema = z
  .object({
    filename: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(120),
    size: z.number().int().positive(),
    type: mediaTypeSchema.default("IMAGE"),
  })
  .strict();

export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type MediaComplete = z.infer<typeof mediaCompleteSchema>;
