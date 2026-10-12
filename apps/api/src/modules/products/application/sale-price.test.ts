import { beforeEach, describe, expect, it, vi } from "vitest";
import { productWriteSchema } from "@oston/contracts";
import { createProduct, getProductBySlug, updateProduct } from "./service.js";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), revision: vi.fn() }));
vi.mock("@oston/database", () => ({
  Prisma: {},
  prisma: {
    product: { findUnique: mocks.findUnique },
    $transaction: async (callback: (tx: unknown) => unknown) => callback({
      product: { create: mocks.create, updateMany: mocks.updateMany },
      productImage: { deleteMany: vi.fn() },
    }),
  },
}));
vi.mock("../../../lib/revisions.js", () => ({ createRevision: mocks.revision, diffSummary: () => ["salePrice"] }));
vi.mock("../../../lib/slug-redirect.js", () => ({ createSlugRedirect: vi.fn() }));

const decimal = (value: number) => ({ toFixed: (digits: number) => value.toFixed(digits) });
const row = {
  id: "product", collectionId: "collection", collection: { slug: "collection", name: "Collection" },
  name: "Conjunto", slug: "conjunto", sku: null, shortDescription: null, description: null,
  images: [], specifications: [], features: [], itemsIncluded: [], details: {}, variants: [],
  price: decimal(5237), salePrice: decimal(3000), availability: "AVAILABLE", featured: false,
  status: "PUBLISHED", sortOrder: 0, isDemo: false, version: 1, deletedAt: null,
  seoTitle: null, seoDescription: null, ogImage: null, ogImageId: null, canonicalPath: null,
  createdAt: new Date(), updatedAt: new Date(),
};
const input = { collectionId: "collection", name: "Conjunto", slug: "conjunto", price: "5237.00", expectedVersion: 1 };

describe("product promotional pricing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUnique.mockResolvedValue(row);
    mocks.create.mockResolvedValue({ id: row.id });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it.each(["0", "5237.00", "6000.00", "-1", "1.999"])("rejects invalid sale price %s", (salePrice) => {
    expect(productWriteSchema.safeParse({ ...input, salePrice }).success).toBe(false);
  });

  it("requires a regular price when promotion is present", () => {
    expect(productWriteSchema.safeParse({ ...input, price: null, salePrice: "3000" }).success).toBe(false);
    expect(productWriteSchema.safeParse({ ...input, salePrice: "3000" }).success).toBe(true);
    expect(productWriteSchema.safeParse({ ...input, salePrice: null }).success).toBe(true);
  });

  it("exposes the exact saved decimal amounts to the storefront", async () => {
    expect(await getProductBySlug("conjunto")).toMatchObject({ price: "5237.00", salePrice: "3000.00" });
  });

  it("persists promotional price in creation and revision", async () => {
    await createProduct(productWriteSchema.parse({ ...input, salePrice: "3000.00" }));
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ salePrice: "3000.00" }) }));
    expect(mocks.revision).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ snapshot: expect.objectContaining({ salePrice: "3000.00" }) }));
  });

  it("preserves promotion for older clients omitting the field", async () => {
    await updateProduct(row.id, productWriteSchema.parse(input));
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ salePrice: "3000.00" }) }));
    expect(mocks.revision).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ snapshot: expect.objectContaining({ salePrice: "3000.00" }) }));
  });

  it("clears promotion explicitly", async () => {
    await updateProduct(row.id, productWriteSchema.parse({ ...input, salePrice: null }));
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ salePrice: null }) }));
  });

  it("rejects lowering regular price below a preserved promotion", async () => {
    await expect(updateProduct(row.id, productWriteSchema.parse({ ...input, price: "2000.00" }))).rejects.toThrow();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
