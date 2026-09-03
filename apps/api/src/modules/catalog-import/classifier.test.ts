import { describe, expect, it } from "vitest";
import { sanitizeCsvCell, toCsv } from "../../lib/csv.js";
import { classifyProductCsv, summarizeClassification } from "./classifier.js";

const header =
  "sku,slug,name,collectionSlug,shortDescription,description,price,availability,status,featured,seoTitle,seoDescription";

const collections = [{ id: "col1", slug: "imperial" }];
const existing = [
  {
    id: "p1",
    sku: "OST-001",
    slug: "panela-imperial",
    collectionId: "col1",
    name: "Panela Imperial",
    shortDescription: null,
    description: null,
    price: "199.00",
    availability: "AVAILABLE",
    status: "DRAFT",
    featured: false,
    seoTitle: null,
    seoDescription: null,
  },
];

describe("product CSV classifier", () => {
  it("dry-run classifies create and update without writing", () => {
    const csv = [
      header,
      "OST-001,panela-imperial,Panela Imperial 28,imperial,,,249.00,AVAILABLE,PUBLISHED,false,,",
      "OST-002,frigideira-nova,Frigideira Nova,imperial,,,99.00,AVAILABLE,DRAFT,false,,",
    ].join("\n");

    const rows = classifyProductCsv(csv, existing, collections);
    const summary = summarizeClassification(rows);
    expect(summary.valid).toBe(true);
    expect(summary.updates).toBe(1);
    expect(summary.creates).toBe(1);
    expect(rows.find((row) => row.action === "CREATE")?.values?.sku).toBe("OST-002");
    expect(rows.find((row) => row.action === "UPDATE")?.productId).toBe("p1");
  });

  it("marks invalid rows with line and field", () => {
    const csv = [header, ",,Sem slug,imperial,,,abc,AVAILABLE,DRAFT,false,,"].join("\n");
    const rows = classifyProductCsv(csv, existing, collections);
    expect(rows[0]?.action).toBe("ERROR");
    expect(rows[0]?.field).toBe("slug");
  });

  it("rejects duplicate SKU in the same file", () => {
    const csv = [
      header,
      "OST-009,um,Um,imperial,,,10.00,AVAILABLE,DRAFT,false,,",
      "OST-009,dois,Dois,imperial,,,10.00,AVAILABLE,DRAFT,false,,",
    ].join("\n");
    const rows = classifyProductCsv(csv, [], collections);
    expect(rows[1]?.action).toBe("ERROR");
    expect(rows[1]?.field).toBe("sku");
    expect(summarizeClassification(rows).valid).toBe(false);
  });

  it("never matches by name only", () => {
    const csv = [header, ",outro-slug,Panela Imperial,imperial,,,10.00,AVAILABLE,DRAFT,false,,"].join("\n");
    const rows = classifyProductCsv(csv, existing, collections);
    expect(rows[0]?.action).toBe("CREATE");
    expect(rows[0]?.productId).toBeUndefined();
  });

  it("errors when a new SKU reuses an existing slug", () => {
    const csv = [header, "OST-NEW,panela-imperial,Outra,imperial,,,10.00,AVAILABLE,DRAFT,false,,"].join("\n");
    const rows = classifyProductCsv(csv, existing, collections);
    expect(rows[0]?.action).toBe("ERROR");
    expect(rows[0]?.field).toBe("sku");
  });
});

describe("import rollback guard", () => {
  it("keeps the import from starting when any row is ERROR", () => {
    const csv = [header, "OST-009,,Sem slug,imperial,,,10.00,AVAILABLE,DRAFT,false,,"].join("\n");
    const summary = summarizeClassification(classifyProductCsv(csv, [], collections));
    expect(summary.valid).toBe(false);
    expect(summary.errors.length).toBeGreaterThan(0);
  });
});

describe("CSV injection", () => {
  it("prefixes formula cells and escapes quotes", () => {
    expect(sanitizeCsvCell("=CMD()")).toBe(`"'=CMD()"`);
    expect(sanitizeCsvCell("+1+1")).toBe(`"'+1+1"`);
    expect(sanitizeCsvCell("-2")).toBe(`"'-2"`);
    expect(sanitizeCsvCell("@sum")).toBe(`"'@sum"`);
    expect(sanitizeCsvCell('a"b')).toBe(`"a""b"`);
    expect(toCsv(["name"], [["=1+1"]])).toContain("'=1+1");
  });
});
