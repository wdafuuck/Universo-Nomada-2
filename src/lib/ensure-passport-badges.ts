import { db } from "@/lib/db";
import { DEFAULT_PASSPORT_BADGES } from "@/lib/default-passport-badges";

/** Crea insignias por defecto que aún no existan (por slug). */
export async function ensureDefaultPassportBadges(): Promise<number> {
  let created = 0;
  for (const b of DEFAULT_PASSPORT_BADGES) {
    const existing = await db.passportBadge.findUnique({ where: { slug: b.slug } });
    if (existing) continue;
    await db.passportBadge.create({ data: b });
    created++;
  }
  return created;
}
