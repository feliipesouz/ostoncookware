import { z } from "zod";

export const idSchema = z.string().min(1).max(64);
export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas minúsculas, números e hífens.");

export const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Valor monetário inválido.")
  .nullable();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(200).optional(),
});

export const expectedVersionSchema = z.number().int().positive().optional();

export const adminListQuerySchema = paginationQuerySchema.extend({
  trash: z
    .union([z.literal("1"), z.literal("0"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
});

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  pageCount: z.number().int(),
});

export const problemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: z.string().optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export const seoFieldsSchema = z.object({
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(320).nullable().optional(),
  ogImageId: z.string().nullable().optional(),
  canonicalPath: z
    .string()
    .max(240)
    .regex(/^\/[a-zA-Z0-9/_-]*$/, "Caminho canônico inválido.")
    .nullable()
    .optional(),
});

export const mediaSummarySchema = z.object({
  id: z.string(),
  url: z.string().url(),
  pathname: z.string(),
  alt: z.string().nullable(),
  mimeType: z.string(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
});

export type MediaSummary = z.infer<typeof mediaSummarySchema>;

export function paginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
