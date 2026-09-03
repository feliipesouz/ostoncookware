import { PRODUCT_CSV_COLUMNS, productImportRequestSchema } from "@oston/contracts";
import { prisma } from "@oston/database";
import { HttpError } from "../../lib/errors.js";
import { csvHeaderMap, parseCsv, toCsv } from "../../lib/csv.js";
import { decimalToString } from "../../lib/mappers.js";
import {
  classifyProductCsv,
  summarizeClassification,
  type ExistingCollection,
  type ExistingProduct,
} from "./classifier.js";

function extractImportKeys(csv: string) {
  const table = parseCsv(csv);
  const header = csvHeaderMap(table[0] ?? []);
  const slugs = new Set<string>();
  const skus = new Set<string>();
  const collectionSlugs = new Set<string>();
  const slugIndex = header.get("slug");
  const skuIndex = header.get("sku");
  const collectionIndex = header.get("collectionSlug");

  for (const row of table.slice(1)) {
    const slug = slugIndex != null ? (row[slugIndex] ?? "").trim() : "";
    const sku = skuIndex != null ? (row[skuIndex] ?? "").trim() : "";
    const collectionSlug = collectionIndex != null ? (row[collectionIndex] ?? "").trim() : "";
    if (slug) slugs.add(slug);
    if (sku) skus.add(sku);
    if (collectionSlug) collectionSlugs.add(collectionSlug);
  }

  return { slugs, skus, collectionSlugs };
}

async function loadCatalogContext(csv: string) {
  const { slugs, skus, collectionSlugs } = extractImportKeys(csv);
  if (slugs.size === 0 && skus.size === 0) {
    return { products: [] as ExistingProduct[], collections: [] as ExistingCollection[] };
  }

  const or = [
    slugs.size ? { slug: { in: [...slugs] } } : undefined,
    skus.size ? { sku: { in: [...skus] } } : undefined,
  ].filter(Boolean) as Array<{ slug?: { in: string[] }; sku?: { in: string[] } }>;

  const [products, collections] = await Promise.all([
    prisma.product.findMany({
      where: or.length ? { deletedAt: null, OR: or } : { deletedAt: null },
      select: {
        id: true,
        sku: true,
        slug: true,
        collectionId: true,
        name: true,
        shortDescription: true,
        description: true,
        price: true,
        availability: true,
        status: true,
        featured: true,
        seoTitle: true,
        seoDescription: true,
      },
    }),
    collectionSlugs.size
      ? prisma.collection.findMany({
          where: { slug: { in: [...collectionSlugs] }, deletedAt: null },
          select: { id: true, slug: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    products: products.map((row) => ({
      ...row,
      price: decimalToString(row.price),
    })),
    collections,
  };
}

export async function previewProductImport(input: unknown) {
  const { csv } = productImportRequestSchema.parse(input);
  const context = await loadCatalogContext(csv);
  const classified = classifyProductCsv(csv, context.products, context.collections);
  const summary = summarizeClassification(classified);
  return {
    valid: summary.valid,
    updates: summary.updates,
    creates: summary.creates,
    skips: summary.skips,
    errors: summary.errors,
    rows: classified.map((row) => ({
      line: row.line,
      action: row.action,
      name: row.values?.name ?? null,
      sku: row.values?.sku ?? null,
      slug: row.values?.slug ?? null,
      field: row.field,
      message: row.message,
    })),
  };
}

export async function importProducts(input: unknown) {
  const { csv } = productImportRequestSchema.parse(input);
  const context = await loadCatalogContext(csv);
  const classified = classifyProductCsv(csv, context.products, context.collections);
  const summary = summarizeClassification(classified);

  if (!summary.valid) {
    throw new HttpError(400, "A importação tem linhas inválidas. Use o preview antes de confirmar.", {
      code: "IMPORT_INVALID",
    });
  }

  const writes = classified.filter((row) => row.action === "CREATE" || row.action === "UPDATE");

  await prisma.$transaction(async (tx) => {
    for (const row of writes) {
      if (!row.values || !row.collectionId) {
        throw new HttpError(400, "Linha de importação incompleta.", { code: "IMPORT_INVALID" });
      }
      const data = {
        collectionId: row.collectionId,
        name: row.values.name,
        slug: row.values.slug,
        sku: row.values.sku,
        shortDescription: row.values.shortDescription,
        description: row.values.description,
        price: row.values.price,
        availability: row.values.availability,
        status: row.values.status,
        featured: row.values.featured,
        seoTitle: row.values.seoTitle,
        seoDescription: row.values.seoDescription,
      };

      if (row.action === "CREATE") {
        await tx.product.create({ data });
      } else if (row.productId) {
        await tx.product.update({
          where: { id: row.productId },
          data: { ...data, version: { increment: 1 } },
        });
      }
    }
  });

  return {
    imported: writes.length,
    creates: summary.creates,
    updates: summary.updates,
    skips: summary.skips,
  };
}

export async function exportProductsCsv(ids?: string[]) {
  const rows = await prisma.product.findMany({
    where: ids && ids.length > 0 ? { id: { in: ids.slice(0, 1000) } } : undefined,
    include: { collection: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 5000,
  });

  return toCsv(
    [...PRODUCT_CSV_COLUMNS],
    rows.map((row) => [
      row.sku,
      row.slug,
      row.name,
      row.collection.slug,
      row.shortDescription,
      row.description,
      decimalToString(row.price),
      row.availability,
      row.status,
      row.featured ? "true" : "false",
      row.seoTitle,
      row.seoDescription,
    ]),
  );
}

export async function applyProductBulk(input: { ids: string[]; action: "publish" | "archive" | "feature" | "unfeature" }) {
  const data =
    input.action === "publish"
      ? { status: "PUBLISHED" as const }
      : input.action === "archive"
        ? { status: "ARCHIVED" as const, featured: false }
        : input.action === "feature"
          ? { featured: true }
          : { featured: false };

  const result = await prisma.product.updateMany({
    where: { id: { in: input.ids } },
    data,
  });

  return { updated: result.count };
}
