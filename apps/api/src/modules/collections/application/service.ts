import { prisma, type Prisma } from "@oston/database";
import { collectionWriteSchema, normalizeSlug, paginationQuerySchema, type CollectionWrite } from "@oston/contracts";
import { humanChangeSummary } from "../../../lib/change-summary.js";
import { HttpError } from "../../../lib/errors.js";
import { decimalToString } from "../../../lib/mappers.js";
import { toMediaSummary } from "../../../lib/media.js";
import { requireExpectedVersion, throwIfVersionConflict, type ContentActor, updateWhereVersion } from "../../../lib/occ.js";
import { toPage } from "../../../lib/pagination.js";
import { createRevision, diffSummary } from "../../../lib/revisions.js";
import { createSlugRedirect } from "../../../lib/slug-redirect.js";
import { assertInTrash, collectionInUseError, softDeleteData, trashWhere } from "../../../lib/soft-delete.js";

const include = {
  coverImage: true,
  ogImage: true,
  updatedBy: { select: { id: true, name: true } },
  images: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
};

function mapCollection(row: Awaited<ReturnType<typeof load>>) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    coverImage: toMediaSummary(row.coverImage),
    gallery: row.images.map((item) => toMediaSummary(item.media)).filter((item) => item !== null),
    priceFrom: decimalToString(row.priceFrom),
    featured: row.featured,
    status: row.status,
    sortOrder: row.sortOrder,
    isDemo: row.isDemo,
    version: row.version,
    deletedAt: row.deletedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImage: toMediaSummary(row.ogImage),
    canonicalPath: row.canonicalPath,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toSnapshot(data: CollectionWrite, slug: string) {
  return {
    name: data.name,
    slug,
    shortDescription: data.shortDescription ?? null,
    description: data.description ?? null,
    coverImageId: data.coverImageId ?? null,
    galleryIds: data.galleryIds,
    priceFrom: data.priceFrom ?? null,
    featured: data.featured,
    status: data.status,
    sortOrder: data.sortOrder,
    isDemo: data.isDemo,
    seoTitle: data.seoTitle ?? null,
    seoDescription: data.seoDescription ?? null,
    ogImageId: data.ogImageId ?? null,
    canonicalPath: data.canonicalPath ?? null,
  };
}

async function load(id: string) {
  const row = await prisma.collection.findUnique({ where: { id }, include });
  if (!row) {
    throw new HttpError(404, "Coleção não encontrada.", { code: "NOT_FOUND" });
  }
  return row;
}

async function syncGallery(tx: Prisma.TransactionClient, collectionId: string, galleryIds: string[]) {
  await tx.collectionImage.deleteMany({ where: { collectionId } });
  if (galleryIds.length === 0) {
    return;
  }
  await tx.collectionImage.createMany({
    data: galleryIds.map((mediaId, sortOrder) => ({ collectionId, mediaId, sortOrder })),
  });
}

async function activeProducts(collectionId: string) {
  return prisma.product.findMany({
    where: { collectionId, deletedAt: null },
    select: { name: true },
  });
}

export async function listPublishedCollections() {
  const rows = await prisma.collection.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    include,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapCollection);
}

export async function getCollectionBySlugForPreview(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpError(404, "Coleção não encontrada.", { code: "NOT_FOUND" });
  }
  const row = await prisma.collection.findUnique({ where: { slug }, include });
  if (!row) {
    throw new HttpError(404, "Coleção não encontrada.", { code: "NOT_FOUND" });
  }
  return mapCollection(row);
}

export async function listCollections(query: unknown = {}) {
  const pagination = paginationQuerySchema.parse(query);
  const where = {
    ...trashWhere(query),
    ...(pagination.q
      ? {
          OR: [
            { name: { contains: pagination.q, mode: "insensitive" as const } },
            { slug: { contains: pagination.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.collection.findMany({
      where,
      include,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.collection.count({ where }),
  ]);

  return toPage(rows.map(mapCollection), total, pagination.page, pagination.pageSize);
}

export async function getCollectionById(id: string) {
  return mapCollection(await load(id));
}

export async function getCollectionBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpError(404, "Coleção não encontrada.", { code: "NOT_FOUND" });
  }
  const row = await prisma.collection.findUnique({ where: { slug }, include });
  if (!row || row.status !== "PUBLISHED" || row.deletedAt) {
    throw new HttpError(404, "Coleção não encontrada.", { code: "NOT_FOUND" });
  }
  return mapCollection(row);
}

export async function createCollection(input: CollectionWrite, actor?: ContentActor) {
  const data = collectionWriteSchema.parse(input);
  const slug = normalizeSlug(data.slug);
  if (!slug) {
    throw new HttpError(400, "Slug inválido.", { code: "INVALID_SLUG" });
  }
  const snapshot = toSnapshot(data, slug);
  const createdId = await prisma.$transaction(async (tx) => {
    const created = await tx.collection.create({
      data: {
        name: data.name,
        slug,
        shortDescription: data.shortDescription ?? null,
        description: data.description ?? null,
        coverImageId: data.coverImageId ?? null,
        priceFrom: data.priceFrom ?? null,
        featured: data.featured,
        status: data.status,
        sortOrder: data.sortOrder,
        isDemo: data.isDemo,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        ogImageId: data.ogImageId ?? null,
        canonicalPath: data.canonicalPath ?? null,
        version: 1,
        updatedById: actor?.id ?? null,
      },
    });
    await syncGallery(tx, created.id, data.galleryIds);
    await createRevision(tx, {
      entityType: "collection",
      entityId: created.id,
      version: 1,
      snapshot,
      changedById: actor?.id,
      changeSummary: "Criação inicial.",
    });
    return created.id;
  });
  return getCollectionById(createdId);
}

export async function updateCollection(id: string, input: CollectionWrite, actor?: ContentActor) {
  const current = await load(id);
  if (current.deletedAt) {
    throw new HttpError(404, "Coleção não encontrada.", { code: "NOT_FOUND" });
  }
  const data = collectionWriteSchema.parse(input);
  const expectedVersion = requireExpectedVersion(data.expectedVersion);
  const slug = normalizeSlug(data.slug);
  if (!slug) {
    throw new HttpError(400, "Slug inválido.", { code: "INVALID_SLUG" });
  }
  const snapshot = toSnapshot(data, slug);
  const previous = toSnapshot(
    {
      ...data,
      name: current.name,
      slug: current.slug,
      shortDescription: current.shortDescription,
      description: current.description,
      coverImageId: current.coverImageId,
      galleryIds: current.images.map((item) => item.mediaId),
      priceFrom: decimalToString(current.priceFrom),
      featured: current.featured,
      status: current.status,
      sortOrder: current.sortOrder,
      isDemo: current.isDemo,
      seoTitle: current.seoTitle,
      seoDescription: current.seoDescription,
      ogImageId: current.ogImageId,
      canonicalPath: current.canonicalPath,
    },
    current.slug,
  );

  await prisma.$transaction(async (tx) => {
    const updated = await tx.collection.updateMany({
      where: updateWhereVersion(id, expectedVersion),
      data: {
        name: data.name,
        slug,
        shortDescription: data.shortDescription ?? null,
        description: data.description ?? null,
        coverImageId: data.coverImageId ?? null,
        priceFrom: data.priceFrom ?? null,
        featured: data.featured,
        status: data.status,
        sortOrder: data.sortOrder,
        isDemo: data.isDemo,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        ogImageId: data.ogImageId ?? null,
        canonicalPath: data.canonicalPath ?? null,
        updatedById: actor?.id ?? null,
        version: { increment: 1 },
      },
    });
    if (updated.count === 0) {
      const latest = await tx.collection.findUnique({
        where: { id },
        include: { updatedBy: { select: { name: true } } },
      });
      throwIfVersionConflict(latest, updated.count);
    }
    await syncGallery(tx, id, data.galleryIds);
    await createRevision(tx, {
      entityType: "collection",
      entityId: id,
      version: expectedVersion + 1,
      snapshot,
      changedById: actor?.id,
      changeSummary: humanChangeSummary(diffSummary(previous, snapshot)),
    });
    await createSlugRedirect(tx, {
      kind: "collection",
      oldSlug: current.slug,
      newSlug: slug,
      createdById: actor?.id,
    });
  });

  return getCollectionById(id);
}

export async function archiveCollection(id: string) {
  await load(id);
  await prisma.collection.update({
    where: { id },
    data: { status: "ARCHIVED", featured: false },
  });
  return getCollectionById(id);
}

export async function softDeleteCollection(id: string, actor?: ContentActor) {
  await load(id);
  const products = await activeProducts(id);
  if (products.length > 0) {
    collectionInUseError(products);
  }
  await prisma.collection.update({
    where: { id },
    data: { ...softDeleteData(), updatedById: actor?.id ?? null },
  });
  return getCollectionById(id);
}

export async function restoreCollection(id: string, actor?: ContentActor) {
  await load(id);
  await prisma.collection.update({
    where: { id },
    data: { deletedAt: null, updatedById: actor?.id ?? null },
  });
  return getCollectionById(id);
}

export async function hardDeleteCollection(id: string) {
  const row = await load(id);
  assertInTrash(row);
  const products = await prisma.product.findMany({
    where: { collectionId: id },
    select: { name: true },
  });
  if (products.length > 0) {
    collectionInUseError(products);
  }
  await prisma.collection.delete({ where: { id } });
}

export async function duplicateCollection(id: string, actor?: ContentActor) {
  const source = await load(id);
  const slug = `${normalizeSlug(source.slug)}-copia-${Date.now().toString(36)}`;
  const createdId = await prisma.$transaction(async (tx) => {
    const created = await tx.collection.create({
      data: {
        name: `${source.name} (cópia)`,
        slug,
        shortDescription: source.shortDescription,
        description: source.description,
        coverImageId: source.coverImageId,
        priceFrom: source.priceFrom,
        featured: false,
        status: "DRAFT",
        sortOrder: source.sortOrder + 1,
        isDemo: source.isDemo,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        ogImageId: source.ogImageId,
        version: 1,
        deletedAt: null,
        updatedById: actor?.id ?? null,
      },
    });
    await syncGallery(
      tx,
      created.id,
      source.images.map((item) => item.mediaId),
    );
    await createRevision(tx, {
      entityType: "collection",
      entityId: created.id,
      version: 1,
      snapshot: {
        name: created.name,
        slug,
        status: "DRAFT",
        galleryIds: source.images.map((item) => item.mediaId),
      },
      changedById: actor?.id,
      changeSummary: "Cópia da coleção.",
    });
    return created.id;
  });
  return getCollectionById(createdId);
}
