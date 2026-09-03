-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ProductAvailability" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadInterest" AS ENUM ('COLLECTION', 'CONSULTANT', 'CATALOG', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignTextAlign" AS ENUM ('left', 'center', 'right');

-- CreateEnum
CREATE TYPE "CampaignFocal" AS ENUM ('center', 'top', 'bottom', 'left', 'right', 'top_left', 'top_right', 'bottom_left', 'bottom_right');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "alt" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "type" "MediaType" NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "desktopImageId" TEXT NOT NULL,
    "mobileImageId" TEXT NOT NULL,
    "videoId" TEXT,
    "imageAlt" TEXT NOT NULL,
    "primaryCtaLabel" TEXT NOT NULL,
    "primaryCtaUrl" TEXT NOT NULL,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaUrl" TEXT,
    "textAlign" "CampaignTextAlign" NOT NULL DEFAULT 'left',
    "focalPosition" "CampaignFocal" NOT NULL DEFAULT 'center',
    "overlay" INTEGER NOT NULL DEFAULT 42,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "collectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "coverImageId" TEXT,
    "priceFrom" DECIMAL(12,2),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImageId" TEXT,
    "canonicalPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_image" (
    "collectionId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "collection_image_pkey" PRIMARY KEY ("collectionId","mediaId")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "specifications" JSONB NOT NULL DEFAULT '[]',
    "features" JSONB NOT NULL DEFAULT '[]',
    "itemsIncluded" JSONB NOT NULL DEFAULT '[]',
    "price" DECIMAL(12,2),
    "availability" "ProductAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImageId" TEXT,
    "canonicalPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image" (
    "productId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_image_pkey" PRIMARY KEY ("productId","mediaId")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "tagline" TEXT,
    "logoId" TEXT,
    "logoInverseId" TEXT,
    "faviconId" TEXT,
    "whatsapp" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "youtube" TEXT,
    "addressLine" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "defaultSeoTitle" TEXT NOT NULL,
    "defaultSeoDescription" TEXT NOT NULL,
    "defaultOgImageId" TEXT,
    "footerText" TEXT,
    "copyrightText" TEXT,
    "catalogPdfId" TEXT,
    "vercelAnalyticsId" TEXT,
    "gtmId" TEXT,
    "gaId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "interest" "LeadInterest" NOT NULL DEFAULT 'CONSULTANT',
    "collectionId" TEXT,
    "message" TEXT,
    "source" TEXT,
    "landingPage" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
CREATE INDEX "media_asset_type_createdAt_idx" ON "media_asset"("type", "createdAt");
CREATE INDEX "campaign_status_sortOrder_startsAt_endsAt_idx" ON "campaign"("status", "sortOrder", "startsAt", "endsAt");
CREATE UNIQUE INDEX "collection_slug_key" ON "collection"("slug");
CREATE INDEX "collection_status_featured_sortOrder_idx" ON "collection"("status", "featured", "sortOrder");
CREATE UNIQUE INDEX "product_slug_key" ON "product"("slug");
CREATE INDEX "product_collectionId_status_sortOrder_idx" ON "product"("collectionId", "status", "sortOrder");
CREATE INDEX "lead_status_createdAt_idx" ON "lead"("status", "createdAt");
CREATE INDEX "lead_phone_idx" ON "lead"("phone");
CREATE INDEX "audit_log_entity_createdAt_idx" ON "audit_log"("entity", "createdAt");
CREATE INDEX "audit_log_actorId_createdAt_idx" ON "audit_log"("actorId", "createdAt");

-- AddForeignKeys
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_desktopImageId_fkey" FOREIGN KEY ("desktopImageId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_mobileImageId_fkey" FOREIGN KEY ("mobileImageId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "collection" ADD CONSTRAINT "collection_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "collection" ADD CONSTRAINT "collection_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "collection_image" ADD CONSTRAINT "collection_image_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_image" ADD CONSTRAINT "collection_image_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product" ADD CONSTRAINT "product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product" ADD CONSTRAINT "product_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logoInverseId_fkey" FOREIGN KEY ("logoInverseId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_faviconId_fkey" FOREIGN KEY ("faviconId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_defaultOgImageId_fkey" FOREIGN KEY ("defaultOgImageId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_catalogPdfId_fkey" FOREIGN KEY ("catalogPdfId") REFERENCES "media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lead" ADD CONSTRAINT "lead_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
