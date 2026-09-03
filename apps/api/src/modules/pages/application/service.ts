import { prisma } from "@oston/database";
import {
  defaultBrandPage,
  pageWriteSchema,
  paginationQuerySchema,
  type PageWrite,
} from "@oston/contracts";
import { wantsTrash } from "../../../lib/cms-prisma.js";
import { HttpError } from "../../../lib/errors.js";
import { toPage } from "../../../lib/pagination.js";

function mapPage(row: Awaited<ReturnType<typeof prisma.page.findFirstOrThrow>>) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    eyebrow: row.eyebrow,
    body: row.body,
    status: row.status,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImageId: row.ogImageId,
    canonicalPath: null as string | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    version: row.version,
  };
}

export async function ensureDefaultPages() {
  const existing = await prisma.page.findFirst({ where: { slug: defaultBrandPage.slug } });
  if (existing) return;
  await prisma.page.create({
    data: {
      slug: defaultBrandPage.slug,
      title: defaultBrandPage.title,
      eyebrow: defaultBrandPage.eyebrow,
      body: defaultBrandPage.body,
      status: defaultBrandPage.status,
      seoTitle: defaultBrandPage.seoTitle,
      seoDescription: defaultBrandPage.seoDescription,
    },
  });
}

export async function listPages(query: unknown = {}) {
  await ensureDefaultPages();
  const pagination = paginationQuerySchema.parse(query);
  const trash = wantsTrash(query);
  const where = {
    deletedAt: trash ? { not: null } : null,
    ...(pagination.q
      ? {
          OR: [
            { title: { contains: pagination.q, mode: "insensitive" as const } },
            { slug: { contains: pagination.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.page.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { slug: "asc" }],
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.page.count({ where }),
  ]);

  return toPage(rows.map(mapPage), total, pagination.page, pagination.pageSize);
}

export async function getPage(id: string) {
  const row = await prisma.page.findUnique({ where: { id } });
  if (!row) {
    throw new HttpError(404, "Página não encontrada.", { code: "NOT_FOUND" });
  }
  return mapPage(row);
}

export async function getPageBySlug(slug: string, options?: { preview?: boolean }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpError(404, "Página não encontrada.", { code: "NOT_FOUND" });
  }
  const row = await prisma.page.findFirst({ where: { slug, deletedAt: null } });
  if (!row) {
    throw new HttpError(404, "Página não encontrada.", { code: "NOT_FOUND" });
  }
  if (!options?.preview && row.status !== "PUBLISHED") {
    throw new HttpError(404, "Página não encontrada.", { code: "NOT_FOUND" });
  }
  return mapPage(row);
}

export async function createPage(input: PageWrite) {
  const data = pageWriteSchema.parse(input);
  const created = await prisma.page.create({
    data: {
      slug: data.slug,
      title: data.title,
      eyebrow: data.eyebrow ?? null,
      body: data.body,
      status: data.status,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      ogImageId: data.ogImageId ?? null,
    },
  });
  return mapPage(created);
}

export async function updatePage(id: string, input: PageWrite) {
  const current = await getPage(id);
  const data = pageWriteSchema.parse(input);
  if (data.expectedVersion !== undefined && current.version !== data.expectedVersion) {
    throw new HttpError(409, "A página foi alterada por outra pessoa. Recarregue e tente de novo.", {
      code: "VERSION_CONFLICT",
    });
  }
  const updated = await prisma.page.update({
    where: { id },
    data: {
      slug: data.slug,
      title: data.title,
      eyebrow: data.eyebrow ?? null,
      body: data.body,
      status: data.status,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      ogImageId: data.ogImageId ?? null,
      version: { increment: 1 },
    },
  });
  return mapPage(updated);
}

export async function listPublishedPageSummaries() {
  await ensureDefaultPages();
  const rows = await prisma.page.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { slug: "asc" },
  });
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    eyebrow: row.eyebrow,
  }));
}
