import { prisma, type Prisma } from "@oston/database";
import type { RevisionEntityType } from "@oston/contracts";
import { HttpError } from "./errors.js";

export type RevisionSnapshot = Record<string, unknown>;

type RevisionWriter = {
  contentRevision: {
    create: (args: {
      data: {
        entityType: string;
        entityId: string;
        version: number;
        snapshot: Prisma.InputJsonValue;
        changedById?: string | null;
        changeSummary?: string | null;
      };
    }) => Promise<{ id: string; version: number }>;
  };
};

export function diffSummary(prev: unknown, next: unknown) {
  const left = asRecord(prev);
  const right = asRecord(next);
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) {
      changed.push(key);
    }
  }
  return changed.sort();
}

export function planRestore(history: { version: number }[], snapshot: unknown) {
  const maxVersion = history.reduce((max, item) => Math.max(max, item.version), 0);
  return {
    nextVersion: maxVersion + 1,
    snapshot,
    keepHistory: true as const,
    historyLength: history.length + 1,
  };
}

export async function createRevision(
  db: RevisionWriter,
  input: {
    entityType: RevisionEntityType;
    entityId: string;
    version: number;
    snapshot: unknown;
    changedById?: string | null;
    changeSummary?: string | null;
  },
) {
  return db.contentRevision.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      version: input.version,
      snapshot: input.snapshot as Prisma.InputJsonValue,
      changedById: input.changedById ?? null,
      changeSummary: input.changeSummary ?? null,
    },
  });
}

export async function listRevisions(entityType: RevisionEntityType, entityId: string) {
  const rows = await prisma.contentRevision.findMany({
    where: { entityType, entityId },
    orderBy: { version: "desc" },
    include: { changedBy: { select: { id: true, name: true, email: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    version: row.version,
    snapshot: row.snapshot,
    changedById: row.changedById,
    changedByName: row.changedBy?.name ?? null,
    changeSummary: row.changeSummary,
    createdAt: row.createdAt,
  }));
}

export async function getRevision(revisionId: string) {
  const row = await prisma.contentRevision.findUnique({
    where: { id: revisionId },
    include: { changedBy: { select: { id: true, name: true, email: true } } },
  });
  if (!row) {
    throw new HttpError(404, "Revisão não encontrada.", { code: "NOT_FOUND" });
  }
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    version: row.version,
    snapshot: row.snapshot,
    changedById: row.changedById,
    changedByName: row.changedBy?.name ?? null,
    changeSummary: row.changeSummary,
    createdAt: row.createdAt,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
