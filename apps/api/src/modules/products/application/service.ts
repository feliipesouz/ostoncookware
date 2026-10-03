import { Prisma, prisma } from "@oston/database";
import {
  normalizeSlug,
  paginationQuerySchema,
  productDetailsSchema,
  productWriteSchema,
  type ProductBulk,
  type ProductWrite,
} from "@oston/contracts";
import { humanChangeSummary } from "../../../lib/change-summary.js";
import { HttpError } from "../../../lib/errors.js";
import { decimalToString } from "../../../lib/mappers.js";
import { toMediaSummary } from "../../../lib/media.js";
import { requireExpectedVersion, throwIfVersionConflict, type ContentActor, updateWhereVersion } from "../../../lib/occ.js";
import { toPage } from "../../../lib/pagination.js";
import { createRevision, diffSummary } from "../../../lib/revisions.js";
import { createSlugRedirect } from "../../../lib/slug-redirect.js";
import { assertInTrash, softDeleteData, trashWhere } from "../../../lib/soft-delete.js";

const include = {
  collection: true,
  ogImage: true,
  updatedBy: { select: { id: true, name: true } },
  images: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: { sortOrder: "asc" as const } },
};

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function asNamedValues(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is { label: string; value: string } =>
      typeof item === "object" &&
      item !== null &&
      "label" in item &&
      "value" in item &&
      typeof item.label === "string" &&
      typeof item.value === "string",
  );
}

function asProductDetails(value: unknown) {
  const parsed = productDetailsSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : { materials: [], compatibilities: [], care: [] };
}

function mapProduct(row: Awaited<ReturnType<typeof load>>) {
  return {
    id: row.id,
    collectionId: row.collectionId,
    collectionSlug: row.collection.slug,
    collectionName: row.collection.name,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    shortDescription: row.shortDescription,
    description: row.description,
    coverImage: toMediaSummary(row.images[0]?.media ?? null),
    images: row.images.map((item) => toMediaSummary(item.media)).filter((item) => item !== null),
    specifications: asNamedValues(row.specifications),
    features: asStringArray(row.features),
    itemsIncluded: asStringArray(row.itemsIncluded),
    details: asProductDetails(row.details),
    variants: row.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      attributes: (variant.attributes ?? {}) as Record<string, unknown>,
      price: decimalToString(variant.price),
      availability: variant.availability,
      sortOrder: variant.sortOrder,
      status: variant.status,
    })),
    price: decimalToString(row.price),
    availability: row.availability,
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

function mapPublishedProduct(row: Awaited<ReturnType<typeof load>>) {
  const product = mapProduct(row);
  return { ...product, variants: product.variants.filter((variant) => variant.status === "PUBLISHED") };
}

function toSnapshot(data: ProductWrite, slug: string) {
  return {
    collectionId: data.collectionId,
    name: data.name,
    slug,
    sku: data.sku ?? null,
    shortDescription: data.shortDescription ?? null,
    description: data.description ?? null,
    imageIds: data.imageIds,
    specifications: data.specifications,
    features: data.features,
    itemsIncluded: data.itemsIncluded,
    details: data.details ?? {},
    variants: data.variants ?? [],
    price: data.price ?? null,
    availability: data.availability,
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

function toUpdateData(data: ProductWrite, slug: string, actor?: ContentActor) {
  return {
    collectionId: data.collectionId,
    name: data.name,
    slug,
    sku: data.sku ?? null,
    shortDescription: data.shortDescription ?? null,
    description: data.description ?? null,
    specifications: data.specifications as Prisma.InputJsonValue,
    features: data.features as Prisma.InputJsonValue,
    itemsIncluded: data.itemsIncluded as Prisma.InputJsonValue,
    details: (data.details ?? {}) as Prisma.InputJsonValue,
    price: data.price ?? null,
    availability: data.availability,
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
  };
}

async function load(id: string) {
  const row = await prisma.product.findUnique({ where: { id }, include });
  if (!row) {
    throw new HttpError(404, "Produto não encontrado.", { code: "NOT_FOUND" });
  }
  return row;
}

async function syncImages(tx: Prisma.TransactionClient, productId: string, imageIds: string[]) {
  await tx.productImage.deleteMany({ where: { productId } });
  if (imageIds.length === 0) {
    return;
  }
  await tx.productImage.createMany({
    data: imageIds.map((mediaId, sortOrder) => ({ productId, mediaId, sortOrder })),
  });
}

async function syncVariants(tx: Prisma.TransactionClient, productId: string, variants: ProductWrite["variants"]) {
  if (variants === undefined) {
    return;
  }
  await tx.productVariant.deleteMany({ where: { productId } });
  if (variants.length === 0) {
    return;
  }
  await tx.productVariant.createMany({
    data: variants.map((variant, index) => ({
      productId,
      name: variant.name,
      sku: variant.sku ?? null,
      attributes: variant.attributes as Prisma.InputJsonValue,
      price: variant.price ?? null,
      availability: variant.availability,
      sortOrder: variant.sortOrder ?? index,
      status: variant.status,
    })),
  });
}

export async function listPublishedProducts(collectionId?: string) {
  const rows = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      collectionId,
    },
    include,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(mapPublishedProduct);
}

export async function getProductBySlugForPreview(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpError(404, "Produto não encontrado.", { code: "NOT_FOUND" });
  }
  const row = await prisma.product.findUnique({ where: { slug }, include });
  if (!row) {
    throw new HttpError(404, "Produto não encontrado.", { code: "NOT_FOUND" });
  }
  return mapProduct(row);
}

export async function listProducts(options?: { collectionId?: string; query?: unknown }) {
  const pagination = paginationQuerySchema.parse(options?.query ?? {});
  const collectionId =
    typeof options?.collectionId === "string" && options.collectionId.length > 0
      ? options.collectionId
      : undefined;

  const where = {
    collectionId,
    ...trashWhere(options?.query),
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
    prisma.product.findMany({
      where,
      include,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return toPage(rows.map(mapProduct), total, pagination.page, pagination.pageSize);
}

export async function getProductById(id: string) {
  return mapProduct(await load(id));
}

export async function getProductBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpError(404, "Produto não encontrado.", { code: "NOT_FOUND" });
  }
  const row = await prisma.product.findUnique({ where: { slug }, include });
  if (!row || row.status !== "PUBLISHED" || row.deletedAt) {
    throw new HttpError(404, "Produto não encontrado.", { code: "NOT_FOUND" });
  }
  return mapPublishedProduct(row);
}

export async function createProduct(input: ProductWrite, actor?: ContentActor) {
  const data = productWriteSchema.parse(input);
  const slug = normalizeSlug(data.slug);
  if (!slug) {
    throw new HttpError(400, "Slug inválido.", { code: "INVALID_SLUG" });
  }
  const snapshot = toSnapshot(data, slug);
  const createdId = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        collectionId: data.collectionId,
        name: data.name,
        slug,
        sku: data.sku ?? null,
        shortDescription: data.shortDescription ?? null,
        description: data.description ?? null,
        specifications: data.specifications as Prisma.InputJsonValue,
        features: data.features as Prisma.InputJsonValue,
        itemsIncluded: data.itemsIncluded as Prisma.InputJsonValue,
        details: (data.details ?? {}) as Prisma.InputJsonValue,
        price: data.price ?? null,
        availability: data.availability,
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
    await syncImages(tx, created.id, data.imageIds);
    await syncVariants(tx, created.id, data.variants);
    await createRevision(tx, {
      entityType: "product",
      entityId: created.id,
      version: 1,
      snapshot,
      changedById: actor?.id,
      changeSummary: "Criação inicial.",
    });
    return created.id;
  });
  return getProductById(createdId);
}

export async function updateProduct(id: string, input: ProductWrite, actor?: ContentActor) {
  const current = await load(id);
  if (current.deletedAt) {
    throw new HttpError(404, "Produto não encontrado.", { code: "NOT_FOUND" });
  }
  const data = productWriteSchema.parse(input);
  const expectedVersion = requireExpectedVersion(data.expectedVersion);
  const slug = normalizeSlug(data.slug);
  if (!slug) {
    throw new HttpError(400, "Slug inválido.", { code: "INVALID_SLUG" });
  }
  const snapshot = toSnapshot(data, slug);
  const previous = toSnapshot(
    {
      ...data,
      collectionId: current.collectionId,
      name: current.name,
      slug: current.slug,
      sku: current.sku,
      shortDescription: current.shortDescription,
      description: current.description,
      imageIds: current.images.map((item) => item.mediaId),
      specifications: asNamedValues(current.specifications),
      features: asStringArray(current.features),
      itemsIncluded: asStringArray(current.itemsIncluded),
      details: asProductDetails(current.details),
      price: decimalToString(current.price),
      availability: current.availability,
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
  const changed = diffSummary(previous, snapshot);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.product.updateMany({
      where: updateWhereVersion(id, expectedVersion),
      data: toUpdateData(data, slug, actor),
    });
    if (updated.count === 0) {
      const latest = await tx.product.findUnique({
        where: { id },
        include: { updatedBy: { select: { name: true } } },
      });
      throwIfVersionConflict(latest, updated.count);
    }
    await syncImages(tx, id, data.imageIds);
    await syncVariants(tx, id, data.variants);
    await createRevision(tx, {
      entityType: "product",
      entityId: id,
      version: expectedVersion + 1,
      snapshot,
      changedById: actor?.id,
      changeSummary: humanChangeSummary(changed),
    });
    await createSlugRedirect(tx, {
      kind: "product",
      oldSlug: current.slug,
      newSlug: slug,
      createdById: actor?.id,
    });
  });

  return getProductById(id);
}

export async function archiveProduct(id: string) {
  await load(id);
  await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED", featured: false },
  });
  return getProductById(id);
}

export async function softDeleteProduct(id: string, actor?: ContentActor) {
  await load(id);
  await prisma.product.update({
    where: { id },
    data: { ...softDeleteData(), updatedById: actor?.id ?? null },
  });
  return getProductById(id);
}

export async function restoreProduct(id: string, actor?: ContentActor) {
  await load(id);
  await prisma.product.update({
    where: { id },
    data: { deletedAt: null, updatedById: actor?.id ?? null },
  });
  return getProductById(id);
}

export async function hardDeleteProduct(id: string) {
  const row = await load(id);
  assertInTrash(row);
  await prisma.product.delete({ where: { id } });
}

export async function bulkProducts(input: ProductBulk) {
  const ids = input.ids;
  if (input.action === "EXPORT") {
    const rows = await prisma.product.findMany({
      where: { id: { in: ids } },
      include,
      orderBy: [{ name: "asc" }],
    });
    return { action: input.action, data: rows.map(mapProduct) };
  }

  const data =
    input.action === "PUBLISH"
      ? { status: "PUBLISHED" as const }
      : input.action === "ARCHIVE"
        ? { status: "ARCHIVED" as const, featured: false }
        : input.action === "FEATURE"
          ? { featured: true }
          : { featured: false };

  await prisma.product.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data,
  });

  const rows = await prisma.product.findMany({
    where: { id: { in: ids } },
    include,
  });
  return { action: input.action, data: rows.map(mapProduct) };
}
