-- Platform foundation (PostgreSQL)
-- Tenant multi-tenant invisible + CRM notes/events + payment externalId

CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");

INSERT INTO "Tenant" ("id", "name", "slug", "configJson", "active", "createdAt", "updatedAt")
VALUES ('universo-nomada', 'Universo Nómada', 'universo-nomada', '{}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;
ALTER TABLE "NomadBenefit" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "BenefitPartnerLogo" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "PassportBadge" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "RouletteSpin" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "HeroSlide" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "BlogArticle" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "BlogSubscriber" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "TourPricing" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "GroupTrip" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "SiteContent" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "CartAbandonment" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'universo-nomada';
ALTER TABLE "LeadPayment" ADD COLUMN IF NOT EXISTS "externalId" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "LeadNote" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeadEvent" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "metaJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "Lead_tenantId_idx" ON "Lead"("tenantId");
CREATE INDEX IF NOT EXISTS "Lead_assignedToUserId_idx" ON "Lead"("assignedToUserId");
CREATE INDEX IF NOT EXISTS "LeadNote_leadId_idx" ON "LeadNote"("leadId");
CREATE INDEX IF NOT EXISTS "LeadEvent_leadId_idx" ON "LeadEvent"("leadId");
CREATE INDEX IF NOT EXISTS "LeadPayment_externalId_idx" ON "LeadPayment"("externalId");
CREATE INDEX IF NOT EXISTS "NomadBenefit_tenantId_idx" ON "NomadBenefit"("tenantId");
CREATE INDEX IF NOT EXISTS "BenefitPartnerLogo_tenantId_idx" ON "BenefitPartnerLogo"("tenantId");
CREATE INDEX IF NOT EXISTS "PassportBadge_tenantId_idx" ON "PassportBadge"("tenantId");
CREATE INDEX IF NOT EXISTS "RouletteSpin_tenantId_idx" ON "RouletteSpin"("tenantId");
CREATE INDEX IF NOT EXISTS "DiscountCode_tenantId_idx" ON "DiscountCode"("tenantId");
CREATE INDEX IF NOT EXISTS "Promotion_tenantId_idx" ON "Promotion"("tenantId");
CREATE INDEX IF NOT EXISTS "Tour_tenantId_idx" ON "Tour"("tenantId");
CREATE INDEX IF NOT EXISTS "InstagramPost_tenantId_idx" ON "InstagramPost"("tenantId");
CREATE INDEX IF NOT EXISTS "HeroSlide_tenantId_idx" ON "HeroSlide"("tenantId");
CREATE INDEX IF NOT EXISTS "BlogArticle_tenantId_idx" ON "BlogArticle"("tenantId");
CREATE INDEX IF NOT EXISTS "BlogSubscriber_tenantId_idx" ON "BlogSubscriber"("tenantId");
CREATE INDEX IF NOT EXISTS "TourPricing_tenantId_idx" ON "TourPricing"("tenantId");
CREATE INDEX IF NOT EXISTS "GroupTrip_tenantId_idx" ON "GroupTrip"("tenantId");
CREATE INDEX IF NOT EXISTS "SiteContent_tenantId_idx" ON "SiteContent"("tenantId");
CREATE INDEX IF NOT EXISTS "CartAbandonment_tenantId_idx" ON "CartAbandonment"("tenantId");
