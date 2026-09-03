import { z } from "zod";

const DANGEROUS_SCHEMES = /^(javascript|data|vbscript|file|blob):/i;

export function isSafeCtaUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500) {
    return false;
  }
  if (DANGEROUS_SCHEMES.test(trimmed) || trimmed.startsWith("\\")) {
    return false;
  }
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return !trimmed.includes("\\") && !trimmed.includes("\0");
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export const safeCtaUrlSchema = z
  .string()
  .min(1)
  .max(500)
  .refine(isSafeCtaUrl, "URL inválida. Use um caminho interno ou http(s).");

export const relativePathSchema = z
  .string()
  .max(240)
  .regex(/^\/[a-zA-Z0-9/_-]*$/, "Caminho canônico inválido.");

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function sanitizeFilename(value: string) {
  const base = value.replace(/\\/g, "/").split("/").pop() ?? "file";
  return base.replace(/[^\w.\-]+/g, "_").slice(0, 180) || "file";
}

export function extensionForMime(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}
