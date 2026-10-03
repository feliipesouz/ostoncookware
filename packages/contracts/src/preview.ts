const PREVIEW_PATHS = [
  /^\/$/,
  /^\/colecoes$/,
  /^\/colecoes\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^\/produtos\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^\/a-marca$/,
  /^\/contato$/,
];

export const previewTypeSchema = ["product", "collection", "campaign", "page", "home"] as const;
export type PreviewType = (typeof previewTypeSchema)[number];

export function parseCampaignPreviewId(value: string | null | undefined) {
  return value && /^[a-zA-Z0-9_-]{1,64}$/.test(value) ? value : null;
}

export function normalizePreviewPath(path: string) {
  const [withoutQuery] = path.trim().split("?");
  return withoutQuery ?? "";
}

export function isSafePreviewPath(path: string) {
  const trimmed = normalizePreviewPath(path);
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return false;
  }
  if (trimmed.startsWith("\\") || /^https?:/i.test(trimmed)) {
    return false;
  }
  if (trimmed.includes("\\") || trimmed.includes("\0") || trimmed.includes("//")) {
    return false;
  }
  return true;
}

export function isAllowlistedPreviewPath(path: string) {
  const trimmed = normalizePreviewPath(path);
  return isSafePreviewPath(trimmed) && PREVIEW_PATHS.some((pattern) => pattern.test(trimmed));
}

export function previewPathFromParams(input: {
  type?: string | null;
  slug?: string | null;
  path?: string | null;
}) {
  if (input.path) {
    return input.path;
  }
  switch (input.type) {
    case "home":
    case "campaign":
      return "/";
    case "collection":
      return input.slug ? `/colecoes/${input.slug}` : "/colecoes";
    case "product":
      return input.slug ? `/produtos/${input.slug}` : null;
    case "page":
      if (!input.slug) return null;
      return input.slug === "a-marca" ? "/a-marca" : `/${input.slug}`;
    default:
      return null;
  }
}

export function resolvePreviewAccess(authenticated: boolean, path: string | null | undefined) {
  if (!authenticated) {
    return { ok: false as const, status: 401 as const, reason: "unauthenticated" as const };
  }
  if (!path || !isSafePreviewPath(path)) {
    return { ok: false as const, status: 403 as const, reason: "unsafe_path" as const };
  }
  if (!isAllowlistedPreviewPath(path)) {
    return { ok: false as const, status: 403 as const, reason: "not_allowlisted" as const };
  }
  return { ok: true as const, path: normalizePreviewPath(path) };
}

export function resolvePreviewDisablePath(returnTo: string | null | undefined) {
  if (!returnTo) {
    return "/";
  }
  if (!isAllowlistedPreviewPath(returnTo)) {
    return "/";
  }
  return normalizePreviewPath(returnTo);
}
