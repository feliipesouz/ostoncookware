import { z } from "zod";
import { safeCtaUrlSchema } from "./url.js";

export const redirectWriteSchema = z
  .object({
    sourcePath: z.string().min(1).max(240),
    destination: safeCtaUrlSchema,
    statusCode: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).default(301),
    active: z.boolean().default(true),
  })
  .strict();

export const redirectPatchSchema = redirectWriteSchema.partial().strict();

export const redirectSchema = z.object({
  id: z.string(),
  sourcePath: z.string(),
  destination: z.string(),
  statusCode: z.number().int(),
  active: z.boolean(),
  createdById: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const redirectLookupQuerySchema = z.object({
  path: z.string().min(1).max(240),
});

export const redirectLookupSchema = z.object({
  destination: z.string(),
  statusCode: z.number().int(),
});

const DANGEROUS_SCHEMES = /^(javascript|data|vbscript|file|blob):/i;
const BLOCKED_PREFIXES = ["/admin", "/api", "/v1"];

export function isSafeRedirectSource(path: string) {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return false;
  }
  if (DANGEROUS_SCHEMES.test(trimmed) || trimmed.includes("\\") || trimmed.includes("\0")) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  return !BLOCKED_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(`${prefix}/`));
}

export type RedirectWrite = z.infer<typeof redirectWriteSchema>;
export type RedirectPatch = z.infer<typeof redirectPatchSchema>;
export type Redirect = z.infer<typeof redirectSchema>;
export type RedirectLookup = z.infer<typeof redirectLookupSchema>;
