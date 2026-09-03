import {
  contentStatusSchema,
  PRODUCT_CSV_COLUMNS,
  productAvailabilitySchema,
} from "@oston/contracts";
import { csvHeaderMap, parseCsv } from "../../lib/csv.js";

export type ImportAction = "CREATE" | "UPDATE" | "SKIP" | "ERROR";

export type ProductImportValues = {
  sku: string | null;
  slug: string;
  name: string;
  collectionSlug: string;
  shortDescription: string | null;
  description: string | null;
  price: string | null;
  availability: "AVAILABLE" | "UNAVAILABLE" | "COMING_SOON";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type ClassifiedProductRow = {
  line: number;
  action: ImportAction;
  field?: string;
  message?: string;
  values?: ProductImportValues;
  productId?: string;
  collectionId?: string;
};

export type ExistingProduct = {
  id: string;
  sku: string | null;
  slug: string;
  collectionId: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  price: string | null;
  availability: string;
  status: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type ExistingCollection = {
  id: string;
  slug: string;
};

function cell(map: Map<string, number>, row: string[], key: string) {
  const index = map.get(key);
  if (index == null) {
    return "";
  }
  return (row[index] ?? "").trim();
}

function emptyToNull(value: string) {
  return value.length > 0 ? value : null;
}

function parseBoolean(value: string, line: number): { ok: true; value: boolean } | { ok: false; message: string } {
  if (!value) {
    return { ok: true, value: false };
  }
  const normalized = value.toLowerCase();
  if (["true", "1", "sim", "yes"].includes(normalized)) {
    return { ok: true, value: true };
  }
  if (["false", "0", "nao", "não", "no"].includes(normalized)) {
    return { ok: true, value: false };
  }
  return { ok: false, message: `Valor inválido para featured na linha ${line}.` };
}

function parsePrice(value: string, line: number): { ok: true; value: string | null } | { ok: false; message: string } {
  if (!value) {
    return { ok: true, value: null };
  }
  const normalized = value.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { ok: false, message: `Preço inválido na linha ${line}.` };
  }
  return { ok: true, value: normalized };
}

function sameProduct(existing: ExistingProduct, values: ProductImportValues, collectionId: string) {
  return (
    existing.sku === values.sku &&
    existing.slug === values.slug &&
    existing.name === values.name &&
    existing.collectionId === collectionId &&
    existing.shortDescription === values.shortDescription &&
    existing.description === values.description &&
    existing.price === values.price &&
    existing.availability === values.availability &&
    existing.status === values.status &&
    existing.featured === values.featured &&
    existing.seoTitle === values.seoTitle &&
    existing.seoDescription === values.seoDescription
  );
}

export function classifyProductCsv(
  csv: string,
  existingProducts: ExistingProduct[],
  collections: ExistingCollection[],
): ClassifiedProductRow[] {
  const table = parseCsv(csv);
  if (table.length === 0) {
    return [{ line: 1, action: "ERROR", field: "csv", message: "CSV vazio." }];
  }

  const header = csvHeaderMap(table[0] ?? []);
  for (const required of ["slug", "name"] as const) {
    if (!header.has(required)) {
      return [{ line: 1, action: "ERROR", field: required, message: `Coluna obrigatória ausente: ${required}.` }];
    }
  }

  const bySku = new Map(existingProducts.filter((row) => row.sku).map((row) => [row.sku as string, row]));
  const bySlug = new Map(existingProducts.map((row) => [row.slug, row]));
  const collectionBySlug = new Map(collections.map((row) => [row.slug, row]));
  const seenSku = new Set<string>();
  const seenSlug = new Set<string>();
  const classified: ClassifiedProductRow[] = [];

  table.slice(1).forEach((row, index) => {
    const line = index + 2;
    const sku = emptyToNull(cell(header, row, "sku"));
    const slug = cell(header, row, "slug");
    const name = cell(header, row, "name");
    const collectionSlug = cell(header, row, "collectionSlug");

    if (sku && seenSku.has(sku)) {
      classified.push({ line, action: "ERROR", field: "sku", message: `SKU duplicado no arquivo: ${sku}.` });
      return;
    }
    if (slug && seenSlug.has(slug)) {
      classified.push({ line, action: "ERROR", field: "slug", message: `Slug duplicado no arquivo: ${slug}.` });
      return;
    }
    if (sku) seenSku.add(sku);
    if (slug) seenSlug.add(slug);

    if (!slug) {
      classified.push({ line, action: "ERROR", field: "slug", message: "Slug é obrigatório." });
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      classified.push({ line, action: "ERROR", field: "slug", message: "Slug inválido." });
      return;
    }
    if (!name) {
      classified.push({ line, action: "ERROR", field: "name", message: "Nome é obrigatório." });
      return;
    }

    const price = parsePrice(cell(header, row, "price"), line);
    if (!price.ok) {
      classified.push({ line, action: "ERROR", field: "price", message: price.message });
      return;
    }

    const featured = parseBoolean(cell(header, row, "featured"), line);
    if (!featured.ok) {
      classified.push({ line, action: "ERROR", field: "featured", message: featured.message });
      return;
    }

    const availabilityRaw = cell(header, row, "availability") || "AVAILABLE";
    const statusRaw = cell(header, row, "status") || "DRAFT";
    const availability = productAvailabilitySchema.safeParse(availabilityRaw);
    const status = contentStatusSchema.safeParse(statusRaw);
    if (!availability.success) {
      classified.push({ line, action: "ERROR", field: "availability", message: "Disponibilidade inválida." });
      return;
    }
    if (!status.success) {
      classified.push({ line, action: "ERROR", field: "status", message: "Status inválido." });
      return;
    }

    const values: ProductImportValues = {
      sku,
      slug,
      name,
      collectionSlug,
      shortDescription: emptyToNull(cell(header, row, "shortDescription")),
      description: emptyToNull(cell(header, row, "description")),
      price: price.value,
      availability: availability.data,
      status: status.data,
      featured: featured.value,
      seoTitle: emptyToNull(cell(header, row, "seoTitle")),
      seoDescription: emptyToNull(cell(header, row, "seoDescription")),
    };

    let existing: ExistingProduct | undefined;
    if (sku) {
      existing = bySku.get(sku);
      if (!existing && bySlug.has(slug)) {
        classified.push({
          line,
          action: "ERROR",
          field: "sku",
          message: "SKU novo, mas o slug já pertence a outro produto. Não identificamos por nome.",
        });
        return;
      }
    } else {
      existing = bySlug.get(slug);
    }

    const collection = collectionSlug ? collectionBySlug.get(collectionSlug) : undefined;
    if (!existing && !collection) {
      classified.push({
        line,
        action: "ERROR",
        field: "collectionSlug",
        message: collectionSlug ? "Coleção não encontrada." : "collectionSlug é obrigatório para criar.",
      });
      return;
    }
    if (existing && collectionSlug && !collection) {
      classified.push({ line, action: "ERROR", field: "collectionSlug", message: "Coleção não encontrada." });
      return;
    }

    const collectionId = collection?.id ?? existing?.collectionId;
    if (!collectionId) {
      classified.push({ line, action: "ERROR", field: "collectionSlug", message: "Coleção não encontrada." });
      return;
    }

    if (existing && sameProduct(existing, values, collectionId)) {
      classified.push({ line, action: "SKIP", values, productId: existing.id, collectionId });
      return;
    }

    if (existing) {
      classified.push({ line, action: "UPDATE", values, productId: existing.id, collectionId });
      return;
    }

    classified.push({ line, action: "CREATE", values, collectionId });
  });

  return classified;
}

export function summarizeClassification(rows: ClassifiedProductRow[]) {
  return {
    valid: rows.every((row) => row.action !== "ERROR"),
    updates: rows.filter((row) => row.action === "UPDATE").length,
    creates: rows.filter((row) => row.action === "CREATE").length,
    skips: rows.filter((row) => row.action === "SKIP").length,
    errors: rows
      .filter((row) => row.action === "ERROR")
      .map((row) => ({ line: row.line, field: row.field ?? "row", message: row.message ?? "Linha inválida." })),
    rows,
  };
}

export { PRODUCT_CSV_COLUMNS };
