import path from "node:path";
import { PrismaClient } from "@prisma/client";

/** Incrementar cuando cambie prisma/schema.prisma para refrescar el cliente en dev. */
const PRISMA_SCHEMA_VERSION = 19;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion?: number;
};

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL es obligatorio en producción.");
    }
    return `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  }
  if (url.startsWith("file:")) {
    const rel = url.replace(/^file:/, "").replace(/^\.\//, "");
    if (!path.isAbsolute(rel)) {
      return `file:${path.join(process.cwd(), rel)}`;
    }
  }
  return url;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function leadModelHasField(client: PrismaClient, field: string): boolean {
  const dmmf = (client as unknown as {
    _dmmf?: { datamodel: { models: { name: string; fields: { name: string }[] }[] } };
  })._dmmf;
  const lead = dmmf?.datamodel.models.find((m) => m.name === "Lead");
  return Boolean(lead?.fields.some((f) => f.name === field));
}

function modelExists(client: PrismaClient, model: string): boolean {
  const delegate = (client as unknown as Record<string, unknown>)[model];
  return delegate != null && typeof delegate === "object" && "findMany" in (delegate as object);
}

function isStaleClient(client: PrismaClient): boolean {
  return (
    !modelExists(client, "heroSlide") ||
    !modelExists(client, "groupTrip") ||
    !modelExists(client, "siteContent") ||
    !modelExists(client, "emailOtp") ||
    !modelExists(client, "nomadBenefit") ||
    !modelExists(client, "benefitPartnerLogo") ||
    !modelExists(client, "passportBadge") ||
    !modelExists(client, "tripDocument") ||
    !modelExists(client, "blogArticle") ||
    !modelExists(client, "discountCode") ||
    !leadModelHasField(client, "userId") ||
    !leadModelHasField(client, "discountCode") ||
    !leadModelHasField(client, "tripEndDate") ||
    !leadModelHasField(client, "rouletteSpinId") ||
    !leadModelHasField(client, "googleReviewRequestAt") ||
    !modelExists(client, "rouletteSpin") ||
    !modelExists(client, "cartAbandonment")
  );
}

function getPrismaClient(): PrismaClient {
  let client = globalForPrisma.prisma;

  if (
    !client
    || isStaleClient(client)
    || globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION
  ) {
    if (client) void client.$disconnect().catch(() => {});
    client = createPrismaClient();
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }

  return client;
}

/** Proxy evita cliente Prisma obsoleto tras hot-reload en desarrollo. */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
