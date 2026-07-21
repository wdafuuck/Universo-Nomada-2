-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NomadBenefit" (
    "id" SERIAL NOT NULL,
    "brandName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "instructions" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "couponCode" TEXT NOT NULL DEFAULT '',
    "discountLabel" TEXT NOT NULL DEFAULT '',
    "restrictionType" TEXT NOT NULL DEFAULT 'none',
    "restrictionDays" INTEGER,
    "restrictionNote" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NomadBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitPartnerLogo" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenefitPartnerLogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassportBadge" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "emoji" TEXT NOT NULL DEFAULT '🌍',
    "matchTerms" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassportBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "destino" TEXT,
    "mensaje" TEXT,
    "status" TEXT NOT NULL DEFAULT 'nuevo',
    "source" TEXT NOT NULL DEFAULT 'web',
    "referralCode" TEXT,
    "paymentMethod" TEXT,
    "paymentPlan" TEXT,
    "cartTotal" INTEGER,
    "amountDue" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "tripEndDate" TIMESTAMP(3),
    "googleReviewRequestAt" TIMESTAMP(3),
    "sumupCheckoutId" TEXT,
    "confirmationEmailSentAt" TIMESTAMP(3),
    "transferReminder5hAt" TIMESTAMP(3),
    "cartJson" TEXT,
    "discountCode" TEXT,
    "discountAmount" INTEGER,
    "rouletteSpinId" INTEGER,
    "roulettePrize" TEXT,
    "rouletteGiftTour" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripDocument" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "docType" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouletteSpin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL DEFAULT '',
    "prize" TEXT NOT NULL,
    "redeemed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "leadId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouletteSpin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "discountType" TEXT NOT NULL DEFAULT 'percent',
    "discountValue" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "discount" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "validUntil" TEXT NOT NULL,
    "originalPrice" INTEGER NOT NULL,
    "discountPrice" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🔥',
    "image" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tour" (
    "tourId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'chile',
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "duration" TEXT NOT NULL DEFAULT '',
    "includesText" TEXT NOT NULL DEFAULT '',
    "excludesText" TEXT NOT NULL DEFAULT '',
    "highlightsText" TEXT NOT NULL DEFAULT '',
    "pdfUrl" TEXT NOT NULL DEFAULT '',
    "galleryJson" TEXT NOT NULL DEFAULT '[]',
    "faqJson" TEXT NOT NULL DEFAULT '[]',
    "optionalToursJson" TEXT NOT NULL DEFAULT '{"pickCount":0,"options":[]}',
    "flightOrigin" TEXT NOT NULL DEFAULT 'SCL',
    "flightDestination" TEXT NOT NULL DEFAULT '',
    "flightBudgetMax" INTEGER,
    "taxType" TEXT NOT NULL DEFAULT 'exento',
    "minDepositPerPerson" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("tourId")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" SERIAL NOT NULL,
    "postUrl" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogArticle" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "titleJson" TEXT NOT NULL,
    "excerptJson" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "categoryJson" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "readTime" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogSubscriber" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'blog',
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPricing" (
    "id" SERIAL NOT NULL,
    "tourId" TEXT NOT NULL,
    "tourName" TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "tiersJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTrip" (
    "id" SERIAL NOT NULL,
    "tourId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "gradient" TEXT NOT NULL DEFAULT 'from-teal-500 to-cyan-600',
    "reservation" INTEGER NOT NULL DEFAULT 100000,
    "price" INTEGER NOT NULL,
    "includesJson" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDeparture" (
    "id" SERIAL NOT NULL,
    "groupTripId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "spotsLeft" INTEGER NOT NULL DEFAULT 0,
    "totalSpots" INTEGER NOT NULL DEFAULT 0,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'available',

    CONSTRAINT "GroupDeparture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL,
    "json" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CartAbandonment" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "cartJson" TEXT NOT NULL,
    "cartTotal" INTEGER NOT NULL DEFAULT 0,
    "reminder1At" TIMESTAMP(3),
    "reminderPrizeAt" TIMESTAMP(3),
    "reminder2At" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartAbandonment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EmailOtp_email_idx" ON "EmailOtp"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PassportBadge_slug_key" ON "PassportBadge"("slug");

-- CreateIndex
CREATE INDEX "TripDocument_leadId_idx" ON "TripDocument"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "RouletteSpin_email_key" ON "RouletteSpin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BlogArticle_slug_key" ON "BlogArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogSubscriber_email_key" ON "BlogSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TourPricing_tourId_key" ON "TourPricing"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupTrip_tourId_key" ON "GroupTrip"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "CartAbandonment_email_key" ON "CartAbandonment"("email");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDocument" ADD CONSTRAINT "TripDocument_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDeparture" ADD CONSTRAINT "GroupDeparture_groupTripId_fkey" FOREIGN KEY ("groupTripId") REFERENCES "GroupTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
