import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  type MediaType,
} from "@oston/contracts";
import { HttpError } from "../../../lib/errors.js";

const BLOB_HOST_SUFFIXES = [".public.blob.vercel-storage.com", ".blob.vercel-storage.com"];

export function allowedFor(type: MediaType) {
  if (type === "IMAGE") {
    return { mime: ALLOWED_IMAGE_MIME_TYPES, max: MAX_IMAGE_BYTES };
  }
  if (type === "VIDEO") {
    return { mime: ALLOWED_VIDEO_MIME_TYPES, max: MAX_VIDEO_BYTES };
  }
  return { mime: ALLOWED_DOCUMENT_MIME_TYPES, max: MAX_DOCUMENT_BYTES };
}

export function assertUpload(input: { mimeType: string; size: number; type: MediaType }) {
  if (input.mimeType === "image/svg+xml" || input.mimeType.includes("svg")) {
    throw new HttpError(400, "SVG não é permitido.", { code: "INVALID_MIME" });
  }
  const rules = allowedFor(input.type);
  if (!(rules.mime as readonly string[]).includes(input.mimeType)) {
    throw new HttpError(400, "Tipo de arquivo não permitido.", { code: "INVALID_MIME" });
  }
  if (input.size > rules.max) {
    throw new HttpError(400, "Arquivo excede o tamanho máximo permitido.", { code: "FILE_TOO_LARGE" });
  }
}

export function assertSafeBlobPath(pathname: string) {
  if (
    pathname.includes("..") ||
    pathname.includes("\\") ||
    pathname.includes("\0") ||
    pathname.startsWith("/") ||
    pathname.includes("//")
  ) {
    throw new HttpError(400, "Caminho de arquivo inválido.", { code: "INVALID_PATH" });
  }
  if (!/^oston\/media\/[a-zA-Z0-9._-]+$/.test(pathname)) {
    throw new HttpError(400, "Caminho de arquivo inválido.", { code: "INVALID_PATH" });
  }
}

export function isTrustedBlobUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return BLOB_HOST_SUFFIXES.some((suffix) => parsed.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}
