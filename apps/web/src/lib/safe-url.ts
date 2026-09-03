const DANGEROUS_SCHEMES = /^(javascript|data|vbscript|file|blob):/i;
const BLOCKED_PREFIXES = ["/admin", "/api", "/v1"];

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
