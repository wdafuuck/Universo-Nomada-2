/**
 * Elimina documentos de viaje vencidos (90 días / 3 meses post-viaje).
 * Uso: node --env-file=.env scripts/cleanup-trip-documents.mjs
 */
import { PrismaClient } from "@prisma/client";
import path from "node:path";

const RETENTION_DAYS = 90;

function parseDuration(raw) {
  const s = (raw ?? "").trim();
  const dxn = s.match(/(\d+)\s*[dD]\s*\/\s*(\d+)\s*[nN]/);
  if (dxn) return Number(dxn[2]);
  const slash = s.match(/(\d+)\s*d[ií]as?\s*\/\s*(\d+)\s*noches?/i);
  if (slash) return Number(slash[2]);
  const daysOnly = s.match(/(\d+)\s*d[ií]as?/i);
  if (daysOnly) return Math.max(Number(daysOnly[1]) - 1, 0);
  return 6;
}

function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function tripEndFromCart(cartJson) {
  if (!cartJson) return null;
  try {
    const item = JSON.parse(cartJson)[0];
    if (!item) return null;
    if (item.checkOut) return new Date(`${item.checkOut}T23:59:59`);
    if (item.checkIn) {
      const nights = parseDuration(item.duration);
      const endIso = addDays(item.checkIn, nights);
      return new Date(`${endIso}T23:59:59`);
    }
  } catch {
    return null;
  }
  return null;
}

const db = new PrismaClient({
  datasources: { db: { url: `file:${path.join(process.cwd(), "prisma", "dev.db")}` } },
});

const fs = await import("node:fs/promises");
const now = new Date();
const leads = await db.lead.findMany({ where: { documents: { some: {} } }, include: { documents: true } });
let removed = 0;

for (const lead of leads) {
  const end = lead.tripEndDate ?? tripEndFromCart(lead.cartJson);
  if (!end) continue;
  const deadline = new Date(end);
  deadline.setDate(deadline.getDate() + RETENTION_DAYS);
  if (now <= deadline) continue;

  for (const doc of lead.documents) {
    if (doc.fileUrl?.startsWith("/uploads/")) {
      try {
        await fs.unlink(path.join(process.cwd(), "public", doc.fileUrl));
      } catch {
        /* ignore */
      }
    }
    removed += 1;
  }
  await db.tripDocument.deleteMany({ where: { leadId: lead.id } });
}

console.log(`✅ Documentos eliminados: ${removed}`);
await db.$disconnect();
