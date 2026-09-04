import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

const monorepoRoot = resolve(process.cwd(), "../..");
loadDotenv({ path: resolve(monorepoRoot, ".env.local") });
loadDotenv({ path: resolve(monorepoRoot, ".env") });
loadDotenv({ path: resolve(process.cwd(), ".env.local") });
loadDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  WEB_ORIGIN: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().optional().default(""),
  REVALIDATION_SECRET: z.string().min(16),
  SENTRY_DSN: z.string().optional().default(""),
  VERCEL_ENV: z.string().optional(),
  VERCEL_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema> & {
  webOrigins: string[];
  isProduction: boolean;
};

export function parseOrigin(value: string) {
  const trimmed = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("WEB_ORIGIN contém um valor que não é uma URL válida.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("WEB_ORIGIN deve usar http ou https.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("WEB_ORIGIN não pode conter credenciais.");
  }

  return parsed.origin;
}

export function parseOrigins(value: string, extras: string[] = []) {
  const origins = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(parseOrigin);

  for (const extra of extras) {
    if (extra) {
      origins.push(parseOrigin(extra.startsWith("http") ? extra : `https://${extra}`));
    }
  }

  const unique = [...new Set(origins)];
  if (unique.length === 0) {
    throw new Error("WEB_ORIGIN must contain at least one origin.");
  }
  return unique;
}

function publicSiteUrl(source: NodeJS.ProcessEnv) {
  if (source.NEXT_PUBLIC_SITE_URL) return source.NEXT_PUBLIC_SITE_URL;
  const vercel =
    source.VERCEL_PROJECT_PRODUCTION_URL ?? source.VERCEL_URL ?? source.VERCEL_BRANCH_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

function isNextProductionBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function withEnvFallbacks(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const site = publicSiteUrl(source);
  const build = isNextProductionBuild();
  return {
    ...source,
    DATABASE_URL:
      source.DATABASE_URL ?? (build ? "postgresql://build:build@127.0.0.1:5432/build" : source.DATABASE_URL),
    BETTER_AUTH_SECRET:
      source.BETTER_AUTH_SECRET ?? (build ? "next-build-placeholder-secret-32ch" : source.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: source.BETTER_AUTH_URL ?? site,
    WEB_ORIGIN: source.WEB_ORIGIN ?? site,
    REVALIDATION_SECRET:
      source.REVALIDATION_SECRET ?? (build ? "next-build-revalidate" : source.REVALIDATION_SECRET),
  };
}

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached && source === process.env) {
    return cached;
  }

  const parsed = envSchema.safeParse(withEnvFallbacks(source));

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables: ${details}`);
  }

  const previewOrigin =
    parsed.data.VERCEL_ENV === "preview" && parsed.data.VERCEL_URL
      ? `https://${parsed.data.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : undefined;

  const webOrigins = parseOrigins(parsed.data.WEB_ORIGIN, previewOrigin ? [previewOrigin] : []);

  const env: Env = {
    ...parsed.data,
    webOrigins,
    isProduction: parsed.data.NODE_ENV === "production",
  };

  if (source === process.env) {
    cached = env;
  }

  return env;
}

export function resetEnvCache() {
  cached = null;
}
