import { prisma } from "@oston/database";
import {
  isSafeRedirectSource,
  paginationQuerySchema,
  redirectPatchSchema,
  redirectWriteSchema,
  type RedirectPatch,
  type RedirectWrite,
} from "@oston/contracts";
import { HttpError } from "../../../lib/errors.js";
import { toPage } from "../../../lib/pagination.js";
import { validateRedirect } from "../../../lib/redirect-validate.js";

function mapRedirect(row: {
  id: string;
  sourcePath: string;
  destination: string;
  statusCode: number;
  active: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    sourcePath: row.sourcePath,
    destination: row.destination,
    statusCode: row.statusCode === 302 ? 302 : 301,
    active: row.active,
    createdAt: row.createdAt,
  };
}

export async function listRedirects(query: unknown = {}) {
  const pagination = paginationQuerySchema.parse(query);
  const where = pagination.q
    ? {
        OR: [
          { sourcePath: { contains: pagination.q, mode: "insensitive" as const } },
          { destination: { contains: pagination.q, mode: "insensitive" as const } },
        ],
      }
    : undefined;
  const [rows, total] = await prisma.$transaction([
    prisma.redirect.findMany({
      where,
      orderBy: [{ sourcePath: "asc" }],
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.redirect.count({ where }),
  ]);
  return toPage(rows.map(mapRedirect), total, pagination.page, pagination.pageSize);
}

export async function getRedirect(id: string) {
  const row = await prisma.redirect.findUnique({ where: { id } });
  if (!row) {
    throw new HttpError(404, "Redirecionamento não encontrado.", { code: "NOT_FOUND" });
  }
  return mapRedirect(row);
}

async function existingPairs(exceptId?: string) {
  const rows = await prisma.redirect.findMany({ where: { active: true } });
  return rows
    .filter((row) => !exceptId || row.id !== exceptId)
    .map((row) => ({
      sourcePath: row.sourcePath,
      destination: row.destination,
      active: row.active,
    }));
}

export async function createRedirect(input: RedirectWrite, createdById?: string) {
  const data = redirectWriteSchema.parse(input);
  const parsed = validateRedirect({
    sourcePath: data.sourcePath,
    destination: data.destination,
    existing: await existingPairs(),
  });
  const created = await prisma.redirect.create({
    data: {
      sourcePath: parsed.sourcePath,
      destination: parsed.destination,
      statusCode: data.statusCode,
      active: data.active,
      createdById: createdById ?? null,
    },
  });
  return mapRedirect(created);
}

export async function updateRedirect(id: string, input: RedirectWrite) {
  await getRedirect(id);
  const data = redirectWriteSchema.parse(input);
  const parsed = validateRedirect({
    sourcePath: data.sourcePath,
    destination: data.destination,
    existing: await existingPairs(id),
  });
  const updated = await prisma.redirect.update({
    where: { id },
    data: {
      sourcePath: parsed.sourcePath,
      destination: parsed.destination,
      statusCode: data.statusCode,
      active: data.active,
    },
  });
  return mapRedirect(updated);
}

export async function patchRedirect(id: string, input: RedirectPatch) {
  const current = await getRedirect(id);
  const data = redirectPatchSchema.parse(input);
  return updateRedirect(id, {
    sourcePath: data.sourcePath ?? current.sourcePath,
    destination: data.destination ?? current.destination,
    statusCode: data.statusCode ?? (current.statusCode === 302 ? 302 : 301),
    active: data.active ?? current.active,
  });
}

export async function deleteRedirect(id: string) {
  await getRedirect(id);
  await prisma.redirect.delete({ where: { id } });
}

export async function deactivateRedirect(id: string) {
  await getRedirect(id);
  const updated = await prisma.redirect.update({
    where: { id },
    data: { active: false },
  });
  return mapRedirect(updated);
}

export async function lookupRedirect(path: string) {
  const normalized = path.trim().replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  if (!isSafeRedirectSource(normalized)) {
    return null;
  }
  const row = await prisma.redirect.findFirst({
    where: { sourcePath: normalized, active: true },
  });
  if (!row || row.destination.startsWith("/admin")) {
    return null;
  }
  return mapRedirect(row);
}
