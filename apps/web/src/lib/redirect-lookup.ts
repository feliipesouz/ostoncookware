type CachedRedirect = {
  destination: string;
  statusCode: 301 | 302;
};

const cache = new Map<string, { at: number; value: CachedRedirect | null }>();
const TTL_MS = 15_000;

export async function lookupPublicRedirect(path: string, apiUrl: string) {
  const cached = cache.get(path);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.value;
  }

  try {
    const response = await fetch(
      `${apiUrl}/v1/public/redirects/lookup?path=${encodeURIComponent(path)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      cache.set(path, { at: Date.now(), value: null });
      return null;
    }
    const payload = (await response.json()) as {
      data?: { destination?: string; statusCode?: number } | null;
    };
    const destination = payload.data?.destination;
    if (!destination || destination.startsWith("/admin") || destination === path) {
      cache.set(path, { at: Date.now(), value: null });
      return null;
    }
    const statusCode = payload.data?.statusCode === 302 ? 302 : 301;
    const value = { destination, statusCode } as const;
    cache.set(path, { at: Date.now(), value });
    return value;
  } catch {
    return cached?.value ?? null;
  }
}

export function isSkippableRedirectPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/v1") ||
    pathname === "/health" ||
    pathname === "/ready" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}
