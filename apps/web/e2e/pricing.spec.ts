import { expect, test } from "@playwright/test";
import { productPricing } from "../src/lib/catalog";

test("pricing calculates savings in cents and never rounds the discount up", () => {
  expect(productPricing({ price: "5237.00", salePrice: "3000.00", isDemo: false })).toEqual({
    regular: "5237.00", current: "3000.00", savings: "2237.00", promotional: true, discountPercent: 42,
  });
  expect(productPricing({ price: "0.30", salePrice: "0.10", isDemo: false })).toMatchObject({ savings: "0.20", discountPercent: 66 });
});

test("pricing suppresses demonstrations and missing or malformed regular prices", () => {
  for (const price of [null, undefined, "", "0", "-1", "1e3", "5.237,00", "9007199254740992"]) {
    expect(productPricing({ price, salePrice: "1", isDemo: false })).toBeNull();
  }
  expect(productPricing({ price: "5237", salePrice: "3000", isDemo: true })).toBeNull();
});

test("invalid or inactive promotions display only the regular price", () => {
  for (const salePrice of [null, undefined, "0", "-1", "5237", "6000", "1.234", "abc"]) {
    expect(productPricing({ price: "5237", salePrice, isDemo: false })).toMatchObject({
      regular: "5237.00", current: "5237.00", promotional: false, discountPercent: 0,
    });
  }
});
