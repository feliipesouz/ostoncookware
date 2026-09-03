-- Editorial OS: versioning, trash, redirects, homepage, navigation, pages, leads CRM

ALTER TABLE "media_asset" ADD COLUMN "focalX" DOUBLE PRECISION;
ALTER TABLE "media_asset" ADD COLUMN "focalY" DOUBLE PRECISION;
ALTER TABLE "media_asset" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;

ALTER TABLE "campaign" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "campaign" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "campaign" ADD COLUMN "updatedById" TEXT;
CREATE INDEX "campaign_deletedAt_idx" ON "campaign"("deletedAt");
CREATE INDEX "campaign_status_deletedAt_idx" ON "campaign"("status", "deletedAt");
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "collection" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "collection" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "collection" ADD COLUMN "updatedById" TEXT;
CREATE INDEX "collection_deletedAt_idx" ON "collection"("deletedAt");
CREATE INDEX "collection_status_deletedAt_idx" ON "collection"("status", "deletedAt");
ALTER TABLE "collection" ADD CONSTRAINT "collection_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product" ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "product" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "product" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "product" ADD COLUMN "updatedById" TEXT;
CREATE INDEX "product_deletedAt_idx" ON "product"("deletedAt");
CREATE INDEX "product_status_deletedAt_idx" ON "product"("status", "deletedAt");
ALTER TABLE "product" ADD CONSTRAINT "product_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "site_settings" ADD COLUMN "whatsappMessage" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "businessHours" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "privacyPolicyUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "termsUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "homepage" JSONB;

ALTER TABLE "lead" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "lead" ADD COLUMN "emailNormalized" TEXT;
ALTER TABLE "lead" ADD COLUMN "phoneNormalized" TEXT;
ALTER TABLE "lead" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
CREATE INDEX "lead_assignedToId_idx" ON "lead"("assignedToId");
CREATE INDEX "lead_emailNormalized_idx" ON "lead"("emailNormalized");
CREATE INDEX "lead_phoneNormalized_idx" ON "lead"("phoneNormalized");
ALTER TABLE "lead" ADD CONSTRAINT "lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "lead"
SET
  "emailNormalized" = LOWER(TRIM("email")),
  "phoneNormalized" = REGEXP_REPLACE("phone", '\D', '', 'g')
WHERE "emailNormalized" IS NULL OR "phoneNormalized" IS NULL;

CREATE TABLE "content_revision" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedById" TEXT,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_revision_entityType_entityId_version_key" ON "content_revision"("entityType", "entityId", "version");
CREATE INDEX "content_revision_entityType_entityId_createdAt_idx" ON "content_revision"("entityType", "entityId", "createdAt");
ALTER TABLE "content_revision" ADD CONSTRAINT "content_revision_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "redirect" (
    "id" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redirect_sourcePath_key" ON "redirect"("sourcePath");
CREATE INDEX "redirect_active_sourcePath_idx" ON "redirect"("active", "sourcePath");
ALTER TABLE "redirect" ADD CONSTRAINT "redirect_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "homepage" (
    "id" TEXT NOT NULL,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navigation_menu" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "navigation_menu_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "navigation_menu_key_key" ON "navigation_menu"("key");

CREATE TABLE "navigation_item" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'INTERNAL',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "navigation_item_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "navigation_item_menuId_sortOrder_idx" ON "navigation_item"("menuId", "sortOrder");
ALTER TABLE "navigation_item" ADD CONSTRAINT "navigation_item_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "navigation_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "navigation_item" ADD CONSTRAINT "navigation_item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "navigation_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "announcement" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcement_active_startsAt_endsAt_idx" ON "announcement"("active", "startsAt", "endsAt");

CREATE TABLE "page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eyebrow" TEXT,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "page_slug_key" ON "page"("slug");
CREATE INDEX "page_status_slug_idx" ON "page"("status", "slug");

CREATE TABLE "lead_note" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_note_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_note_leadId_createdAt_idx" ON "lead_note"("leadId", "createdAt");
ALTER TABLE "lead_note" ADD CONSTRAINT "lead_note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_note" ADD CONSTRAINT "lead_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lead_activity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_activity_leadId_createdAt_idx" ON "lead_activity"("leadId", "createdAt");
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "price" DECIMAL(12,2),
    "availability" "ProductAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_variant_productId_sortOrder_idx" ON "product_variant"("productId", "sortOrder");
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "business_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "business_event_type_createdAt_idx" ON "business_event"("type", "createdAt");
