/**
 * Importa content-dump.json (export SQLite local) a Postgres del servidor.
 * Uso: node scripts/import-content-dump.mjs [ruta-dump]
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const dumpPath = process.argv[2] || "./content-dump.json";
const raw = JSON.parse(readFileSync(dumpPath, "utf8"));
const prisma = new PrismaClient();

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return Boolean(v);
}

function toDate(v) {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    // SQLite epoch ms or seconds
    return new Date(v > 1e12 ? v : v * 1000);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function stripMeta(row, extraOmit = []) {
  const omit = new Set(["id", ...extraOmit]);
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (omit.has(k)) continue;
    out[k] = v;
  }
  return out;
}

async function replaceMany(label, clearFn, createFn) {
  await clearFn();
  const n = await createFn();
  console.log(`${label}: ${n}`);
}

async function main() {
  console.log("Importando desde", dumpPath);

  // Orden: hijos primero al borrar
  await replaceMany(
    "GroupDeparture+GroupTrip",
    async () => {
      await prisma.groupDeparture.deleteMany();
      await prisma.groupTrip.deleteMany();
    },
    async () => {
      const trips = raw.GroupTrip || [];
      const deps = raw.GroupDeparture || [];
      // Map old id -> new id
      const idMap = new Map();
      for (const t of trips) {
        const created = await prisma.groupTrip.create({
          data: {
            tourId: t.tourId,
            name: t.name,
            duration: t.duration,
            image: t.image,
            gradient: t.gradient ?? "from-teal-500 to-cyan-600",
            reservation: t.reservation ?? 100000,
            price: t.price,
            includesJson: t.includesJson ?? "[]",
            active: toBool(t.active),
            sortOrder: t.sortOrder ?? 0,
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
        idMap.set(t.id, created.id);
      }
      for (const d of deps) {
        const groupTripId = idMap.get(d.groupTripId);
        if (!groupTripId) continue;
        await prisma.groupDeparture.create({
          data: {
            groupTripId,
            date: d.date,
            spotsLeft: d.spotsLeft ?? 0,
            totalSpots: d.totalSpots ?? 0,
            availabilityStatus: d.availabilityStatus ?? "available",
          },
        });
      }
      return trips.length;
    }
  );

  await replaceMany(
    "Tour",
    () => prisma.tour.deleteMany(),
    async () => {
      for (const t of raw.Tour || []) {
        await prisma.tour.create({
          data: {
            tourId: t.tourId,
            name: t.name,
            subtitle: t.subtitle ?? "",
            description: t.description ?? "",
            image: t.image,
            tag: t.tag ?? "",
            category: t.category ?? "chile",
            price: t.price,
            originalPrice: t.originalPrice ?? null,
            duration: t.duration ?? "",
            includesText: t.includesText ?? "",
            excludesText: t.excludesText ?? "",
            highlightsText: t.highlightsText ?? "",
            pdfUrl: t.pdfUrl ?? "",
            galleryJson: t.galleryJson ?? "[]",
            faqJson: t.faqJson ?? "[]",
            optionalToursJson: t.optionalToursJson ?? '{"pickCount":0,"options":[]}',
            flightOrigin: t.flightOrigin ?? "SCL",
            flightDestination: t.flightDestination ?? "",
            flightBudgetMax: t.flightBudgetMax ?? null,
            taxType: t.taxType ?? "exento",
            minDepositPerPerson: t.minDepositPerPerson ?? 0,
            active: toBool(t.active),
            sortOrder: t.sortOrder ?? 0,
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
      }
      return (raw.Tour || []).length;
    }
  );

  await replaceMany(
    "TourPricing",
    () => prisma.tourPricing.deleteMany(),
    async () => {
      for (const t of raw.TourPricing || []) {
        await prisma.tourPricing.create({
          data: {
            tourId: t.tourId,
            tourName: t.tourName,
            basePrice: t.basePrice,
            tiersJson: t.tiersJson,
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
      }
      return (raw.TourPricing || []).length;
    }
  );

  await replaceMany(
    "Promotion",
    () => prisma.promotion.deleteMany(),
    async () => {
      for (const t of raw.Promotion || []) {
        await prisma.promotion.create({
          data: {
            title: t.title,
            subtitle: t.subtitle,
            discount: t.discount,
            destination: t.destination,
            validUntil: t.validUntil,
            originalPrice: t.originalPrice,
            discountPrice: t.discountPrice,
            emoji: t.emoji ?? "🔥",
            image: t.image ?? "",
            active: toBool(t.active),
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
      }
      return (raw.Promotion || []).length;
    }
  );

  await replaceMany(
    "BenefitPartnerLogo",
    () => prisma.benefitPartnerLogo.deleteMany(),
    async () => {
      for (const t of raw.BenefitPartnerLogo || []) {
        await prisma.benefitPartnerLogo.create({
          data: {
            name: t.name ?? "",
            imageUrl: t.imageUrl,
            linkUrl: t.linkUrl ?? "",
            active: toBool(t.active),
            sortOrder: t.sortOrder ?? 0,
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
      }
      return (raw.BenefitPartnerLogo || []).length;
    }
  );

  await replaceMany(
    "NomadBenefit",
    () => prisma.nomadBenefit.deleteMany(),
    async () => {
      for (const t of raw.NomadBenefit || []) {
        await prisma.nomadBenefit.create({
          data: stripMeta({
            ...t,
            active: toBool(t.active),
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          }),
        });
      }
      return (raw.NomadBenefit || []).length;
    }
  );

  await replaceMany(
    "PassportBadge",
    () => prisma.passportBadge.deleteMany(),
    async () => {
      for (const t of raw.PassportBadge || []) {
        await prisma.passportBadge.create({
          data: {
            slug: t.slug,
            name: t.name,
            destination: t.destination ?? "",
            description: t.description ?? "",
            image: t.image ?? "",
            emoji: t.emoji ?? "🌍",
            matchTerms: t.matchTerms ?? "[]",
            active: toBool(t.active),
            sortOrder: t.sortOrder ?? 0,
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
      }
      return (raw.PassportBadge || []).length;
    }
  );

  await replaceMany(
    "HeroSlide",
    () => prisma.heroSlide.deleteMany(),
    async () => {
      for (const t of raw.HeroSlide || []) {
        await prisma.heroSlide.create({
          data: {
            imageUrl: t.imageUrl,
            label: t.label ?? "",
            active: toBool(t.active),
            sortOrder: t.sortOrder ?? 0,
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
      }
      return (raw.HeroSlide || []).length;
    }
  );

  await replaceMany(
    "InstagramPost",
    () => prisma.instagramPost.deleteMany(),
    async () => {
      for (const t of raw.InstagramPost || []) {
        await prisma.instagramPost.create({
          data: {
            postUrl: t.postUrl,
            caption: t.caption ?? "",
            imageUrl: t.imageUrl ?? "",
            active: toBool(t.active),
            sortOrder: t.sortOrder ?? 0,
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
      }
      return (raw.InstagramPost || []).length;
    }
  );

  await replaceMany(
    "BlogArticle",
    () => prisma.blogArticle.deleteMany(),
    async () => {
      for (const t of raw.BlogArticle || []) {
        await prisma.blogArticle.create({
          data: {
            slug: t.slug,
            titleJson: t.titleJson,
            excerptJson: t.excerptJson,
            contentJson: t.contentJson,
            categoryJson: t.categoryJson,
            image: t.image ?? "",
            date: t.date,
            readTime: t.readTime ?? 5,
            active: toBool(t.active),
            sortOrder: t.sortOrder ?? 0,
            createdAt: toDate(t.createdAt),
            updatedAt: toDate(t.updatedAt),
          },
        });
      }
      return (raw.BlogArticle || []).length;
    }
  );

  // Users: upsert so admin login works
  let users = 0;
  for (const u of raw.User || []) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        password: u.password ?? null,
        role: u.role ?? "user",
        emailVerifiedAt: toDate(u.emailVerifiedAt) ?? null,
        createdAt: toDate(u.createdAt),
        updatedAt: toDate(u.updatedAt),
      },
      update: {
        email: u.email,
        name: u.name ?? null,
        password: u.password ?? null,
        role: u.role ?? "user",
        emailVerifiedAt: toDate(u.emailVerifiedAt) ?? null,
      },
    });
    users++;
  }
  console.log(`User: ${users}`);

  const inactive = await prisma.tour.findMany({
    where: { active: false },
    select: { tourId: true, name: true },
  });
  const logos = await prisma.benefitPartnerLogo.count();
  console.log("OK — tours inactivos:", inactive);
  console.log("OK — logos:", logos);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
