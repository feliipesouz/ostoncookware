export const PINO_REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.Authorization",
  "req.headers.cookie",
  "req.headers.Cookie",
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_SECRET",
  "BLOB_READ_WRITE_TOKEN",
  "REVALIDATION_SECRET",
  "req.body",
  "*.password",
  "*.token",
  "*.secret",
  "*.credential",
  "*.authorization",
  "*.cookie",
  "*.DATABASE_URL",
  "*.DIRECT_URL",
  "*.BETTER_AUTH_SECRET",
  "*.BLOB_READ_WRITE_TOKEN",
  "*.REVALIDATION_SECRET",
];

/** Error messages/stacks can contain connection strings, SQL and customer data. */
export function errorForLog(error: unknown) {
  if (!(error instanceof Error)) {
    return { type: "UnknownError" };
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
  return {
    type: /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(error.name) ? error.name : "Error",
    ...(code && /^(?:P\d{4}|E[A-Z_]+|FST_[A-Z_]+|ABORT_ERR)$/.test(code) ? { code } : {}),
  };
}

type ServerLogContext = {
  correlationId?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  origin?: string;
  tags?: readonly string[];
  error?: unknown;
};

/** JSON logs work in the Vercel bundle without Pino transport workers. */
export function serverLog(
  level: "info" | "warn" | "error",
  event: string,
  context: ServerLogContext = {},
) {
  // Deliberate allowlist: never spread request objects, bodies or headers here.
  console[level](JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    correlationId: context.correlationId,
    method: context.method,
    route: context.route,
    statusCode: context.statusCode,
    durationMs: context.durationMs,
    origin: context.origin,
    tags: context.tags,
    ...(context.error === undefined ? {} : { error: errorForLog(context.error) }),
  }));
}
