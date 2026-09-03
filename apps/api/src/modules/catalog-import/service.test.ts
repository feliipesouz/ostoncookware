import { beforeEach, describe, expect, it, vi } from "vitest";

const productFindMany = vi.fn();
const collectionFindMany = vi.fn();
const transaction = vi.fn();

vi.mock("@oston/database", () => ({
  prisma: {
    product: { findMany: (...args: unknown[]) => productFindMany(...args) },
    collection: { findMany: (...args: unknown[]) => collectionFindMany(...args) },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

const header =
  "sku,slug,name,collectionSlug,shortDescription,description,price,availability,status,featured,seoTitle,seoDescription";

describe("importProducts transaction", () => {
  beforeEach(() => {
    productFindMany.mockReset();
    collectionFindMany.mockReset();
    transaction.mockReset();
    productFindMany.mockResolvedValue([]);
    collectionFindMany.mockResolvedValue([{ id: "col1", slug: "imperial" }]);
  });

  it("does not open a transaction when the classifier finds errors", async () => {
    const { importProducts } = await import("./service.js");
    await expect(
      importProducts({
        csv: [header, "OST-009,,Sem slug,imperial,,,10.00,AVAILABLE,DRAFT,false,,"].join("\n"),
      }),
    ).rejects.toMatchObject({ status: 400, code: "IMPORT_INVALID" });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rolls back when a write inside the transaction fails", async () => {
    transaction.mockImplementation(async (fn: (tx: { product: { create: () => Promise<unknown>; update: () => Promise<unknown> } }) => Promise<unknown>) => {
      await fn({
        product: {
          create: () => Promise.reject(new Error("write failed")),
          update: () => Promise.resolve({}),
        },
      });
    });

    const { importProducts } = await import("./service.js");
    await expect(
      importProducts({
        csv: [header, "OST-002,frigideira-nova,Frigideira Nova,imperial,,,99.00,AVAILABLE,DRAFT,false,,"].join("\n"),
      }),
    ).rejects.toThrow(/write failed/);
  });
});
