import { getApp } from "./app.js";
import { headersFromInject, isHopByHopHeader } from "./http-headers.js";

const METHODS = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"] as const;
type InjectMethod = (typeof METHODS)[number];

function injectMethod(value: string): InjectMethod {
  const method = value.toUpperCase();
  return (METHODS as readonly string[]).includes(method) ? (method as InjectMethod) : "GET";
}

export async function handleWebRequest(request: Request): Promise<Response> {
  const app = await getApp();
  await app.ready();

  const url = new URL(request.url);
  const method = injectMethod(request.method);
  const hasBody = method !== "GET" && method !== "HEAD";

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (isHopByHopHeader(key)) {
      return;
    }
    headers[key] = value;
  });

  const result = await app.inject({
    method,
    url: `${url.pathname}${url.search}`,
    headers,
    remoteAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    payload: hasBody ? Buffer.from(await request.arrayBuffer()) : undefined,
  });

  const empty = result.statusCode === 204 || result.statusCode === 304;
  return new Response(empty ? null : new Uint8Array(result.rawPayload), {
    status: result.statusCode,
    headers: headersFromInject(result.headers as Record<string, unknown>),
  });
}
