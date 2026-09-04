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
