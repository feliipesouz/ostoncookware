-- Rate limiting persistente (Better Auth + throttle de leads/upload)
CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

CREATE TABLE "throttle" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "throttle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "throttle_key_key" ON "throttle"("key");
CREATE INDEX "throttle_expiresAt_idx" ON "throttle"("expiresAt");

-- Pathname único para assets
CREATE UNIQUE INDEX "media_asset_pathname_key" ON "media_asset"("pathname");
CREATE INDEX "media_asset_createdAt_idx" ON "media_asset"("createdAt");

-- Índices de consulta
CREATE INDEX "collection_featured_idx" ON "collection"("featured");
CREATE INDEX "collection_image_mediaId_idx" ON "collection_image"("mediaId");
CREATE INDEX "product_status_featured_idx" ON "product"("status", "featured");
CREATE INDEX "product_image_mediaId_idx" ON "product_image"("mediaId");
CREATE INDEX "lead_createdAt_idx" ON "lead"("createdAt");
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- Galerias não devem sumir em silêncio quando a mídia é removida
ALTER TABLE "collection_image" DROP CONSTRAINT "collection_image_mediaId_fkey";
ALTER TABLE "collection_image" ADD CONSTRAINT "collection_image_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_image" DROP CONSTRAINT "product_image_mediaId_fkey";
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
