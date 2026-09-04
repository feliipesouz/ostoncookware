import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/index.js";

const monorepoRoot = resolve(process.cwd(), "../..");
loadDotenv({ path: resolve(monorepoRoot, ".env.local") });
loadDotenv({ path: resolve(monorepoRoot, ".env") });
loadDotenv({ path: resolve(process.cwd(), ".env.local") });
loadDotenv();

function createAdapter(connectionString: string) {
  // Na Vercel o adapter serverless (WebSocket) é o certo.
  // No laptop / CI, TCP via `pg` evita falha de WebSocket no Neon.
  if (connectionString.includes("neon.tech") && process.env.VERCEL) {
    return new PrismaNeon({ connectionString });
  }

  return new PrismaPg({ connectionString });
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  return new PrismaClient({
    adapter: createAdapter(connectionString),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
