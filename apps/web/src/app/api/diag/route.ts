import { publicRuntimeError } from "@/lib/runtime-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function probe(name: string, load: () => Promise<unknown>) {
  try {
    await load();
    return { name, ok: true as const };
  } catch (error) {
    return { name, ok: false as const, message: publicRuntimeError(error) };
  }
}

export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    BETTER_AUTH_SECRET: Boolean(process.env.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? null,
    WEB_ORIGIN: process.env.WEB_ORIGIN ?? null,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    REVALIDATION_SECRET: Boolean(process.env.REVALIDATION_SECRET),
    VERCEL: Boolean(process.env.VERCEL),
    NODE_ENV: process.env.NODE_ENV ?? null,
  };

  const probes = [
    await probe("pg", async () => import("pg")),
    await probe("@prisma/adapter-pg", async () => import("@prisma/adapter-pg")),
    await probe("@oston/database", async () => import("@oston/database")),
    await probe("@oston/api/auth", async () => import("@oston/api/auth")),
    await probe("@oston/api/handler", async () => import("@oston/api/handler")),
  ];

  return Response.json({ env, probes, cwd: process.cwd() });
}
