const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

export function isHopByHopHeader(name: string) {
  return HOP_BY_HOP.has(name.toLowerCase());
}

export function headersFromInject(headers: Record<string, unknown>): Headers {
  const result = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) {
      continue;
    }

    const name = key.toLowerCase();
    if (isHopByHopHeader(name)) {
      continue;
    }

    if (name === "set-cookie") {
      const cookies = Array.isArray(value) ? value : [value];
      for (const cookie of cookies) {
        result.append("set-cookie", String(cookie));
      }
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(name, String(item));
      }
      continue;
    }

    result.set(name, String(value));
  }

  return result;
}
