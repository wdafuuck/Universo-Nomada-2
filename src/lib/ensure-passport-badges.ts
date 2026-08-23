import { db } from "@/lib/db";
import { DEFAULT_PASSPORT_BADGES } from "@/lib/default-passport-badges";

/**
 * Seed solo si no hay ninguna insignia.
 * Nunca re-crea insignias borradas desde admin (antes recreaba Río/Ilha/Iguazú
 * cada vez que se abría Pasaporte o se sincronizaban clientes).
 */
export async function ensureDefaultPassportBadges(): Promise<number> {
  const count = await db.passportBadge.count();
  if (count > 0) return 0;

  let created = 0;
  for (const b of DEFAULT_PASSPORT_BADGES) {
    await db.passportBadge.create({ data: b });
    created++;
  }
  return created;
}
