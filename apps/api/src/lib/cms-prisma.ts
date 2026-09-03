import { prisma } from "@oston/database";
import { HttpError } from "./errors.js";

type Delegate = {
  findUnique: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  findFirst: (args?: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  findMany: (args?: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  upsert: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  delete: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  deleteMany: (args?: Record<string, unknown>) => Promise<{ count: number }>;
  createMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
  count: (args?: Record<string, unknown>) => Promise<number>;
};

export type CmsModel =
  | "homepage"
  | "navigationMenu"
  | "navigationItem"
  | "announcement"
  | "page"
  | "redirect";

export function cms(model: CmsModel): Delegate {
  const client = prisma as unknown as Record<string, Delegate | undefined>;
  const delegate = client[model];
  if (!delegate) {
    throw new HttpError(503, "O schema do CMS ainda não está disponível. Aguarde a migration.", {
      code: "CMS_SCHEMA_PENDING",
    });
  }
  return delegate;
}

export function asDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function optionalString(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

export function wantsTrash(query: unknown) {
  if (!query || typeof query !== "object") return false;
  const value = (query as { trash?: unknown }).trash;
  return value === true || value === 1 || value === "1" || value === "true";
}
