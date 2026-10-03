import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProductById, getProductBySlug, getProductBySlugForPreview, listPublishedProducts } from "./service.js";

const database = vi.hoisted(() => ({ findUnique: vi.fn(), findMany: vi.fn() }));
vi.mock("@oston/database", () => ({ prisma: { product: database }, Prisma: {} }));

const variants = ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"].map((status, index) => ({
  id: `variant-${status}`, name: `Variant ${status}`, sku: null, attributes: {}, price: null,
  availability: "AVAILABLE", sortOrder: index, status,
}));
const product = {
  id: "product", collectionId: "collection", collection: { slug: "colecao", name: "Coleção" },
  name: "Conjunto", slug: "conjunto", sku: null, shortDescription: null, description: null,
  images: [], specifications: [], features: [], itemsIncluded: [], details: {}, variants,
  price: null, availability: "AVAILABLE", featured: false, status: "PUBLISHED", sortOrder: 0,
  isDemo: false, version: 1, deletedAt: null, seoTitle: null, seoDescription: null,
  ogImage: null, canonicalPath: null, createdAt: new Date(), updatedAt: new Date(),
};

describe("public product variant visibility", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    database.findUnique.mockResolvedValue(product);
    database.findMany.mockResolvedValue([product]);
  });

  it("omits unpublished variants from both public product detail and collection listings", async () => {
    const detail = await getProductBySlug(product.slug);
    const collection = await listPublishedProducts(product.collectionId);
    expect(detail.variants.map((variant) => variant.id)).toEqual(["variant-PUBLISHED"]);
    expect(collection[0]?.variants).toEqual(detail.variants);
  });

  it("preserves all saved variants for authenticated CMS and preview consumers", async () => {
    const admin = await getProductById(product.id);
    const preview = await getProductBySlugForPreview(product.slug);
    expect(admin.variants.map((variant) => variant.status)).toEqual(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]);
    expect(preview.variants).toEqual(admin.variants);
    expect(product.variants).toHaveLength(4);
  });
});
