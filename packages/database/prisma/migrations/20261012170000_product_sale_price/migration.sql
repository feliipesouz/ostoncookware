ALTER TABLE "product" ADD COLUMN "salePrice" DECIMAL(12,2);
ALTER TABLE "product" ADD CONSTRAINT "product_salePrice_check"
  CHECK ("salePrice" IS NULL OR ("price" IS NOT NULL AND "salePrice" > 0 AND "salePrice" < "price"));
