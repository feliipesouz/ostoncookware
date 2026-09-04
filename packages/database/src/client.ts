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
  // Node (Vercel serverless e CLI) fala com o Neon por TCP.
  // O adapter WebSocket quebra no bundle webpack do Next.
  if (connectionString.includes("neon.tech") && process.env.PRISMA_ADAPTER === "neon") {
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

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
