const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function mediaSrc(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/demo/")) {
      return demoPublicPath(parsed.pathname);
    }
    return url;
  } catch {
    return demoPublicPath(url);
  }
}

function demoPublicPath(path: string) {
  if (path.startsWith("/demo/") && path.toLowerCase().endsWith(".svg")) {
    return `${path.slice(0, -4)}.png`;
  }
  return path;
}

export async function publicGet<T>(path: string, tags: string[]): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    next: { tags, revalidate: 60 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(`Falha ao carregar ${path}`, response.status);
  }

  return (await response.json()) as T;
}

export function whatsappLink(phone: string | null | undefined, message: string) {
  if (!phone) {
    return "/contato";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return "/contato";
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message.slice(0, 300))}`;
}
