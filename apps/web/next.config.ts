import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  // React/Next usam eval() só no modo dev (callstacks, Fast Refresh).
  ...(!isProd ? ["'unsafe-eval'", "blob:"] : []),
  "https://va.vercel-scripts.com",
  "https://vitals.vercel-insights.com",
].join(" ");

const connectSrc = [
  "'self'",
  "https://va.vercel-scripts.com",
  "https://vitals.vercel-insights.com",
  ...(!isProd ? ["ws:", "wss:"] : []),
].join(" ");

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com",
  "font-src 'self'",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@oston/api", "@oston/contracts", "@oston/database", "@oston/design-system"],
  serverExternalPackages: [
    "fastify",
    "@fastify/cors",
    "@fastify/helmet",
    "@fastify/rate-limit",
    "@prisma/adapter-neon",
    "@prisma/adapter-pg",
    "@prisma/client",
    "@prisma/client-runtime-utils",
    "@neondatabase/serverless",
    "better-auth",
    "pg",
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
  typedRoutes: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "localhost" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    const documentHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: csp },
      ...(isProd
        ? [{ key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" }]
        : []),
    ];

    return [
      {
        // Chrome não pinta SVG em <img> se a resposta do arquivo tiver CSP.
        source: "/demo/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        // Só HTML/rotas — arquivo estático com CSP quebra SVG/PNG no Chrome.
        source: "/((?!_next/static|_next/image|demo/|.*\\.[a-zA-Z0-9]+$).*)",
        headers: documentHeaders,
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, private" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/revalidate",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
