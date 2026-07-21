import { db } from "@/lib/db";
import { getMonthInfo } from "@/lib/promo-utils";

/** Actualiza promos estacionales (mes actual) en la base de datos. */
export async function syncSeasonalPromotions() {
  const { month, monthUpper, validUntil } = getMonthInfo();
  const promos = await db.promotion.findMany();

  for (const promo of promos) {
    let title = promo.title;
    let until = promo.validUntil;
    let changed = false;

    if (/^Destino del Mes/i.test(promo.title)) {
      const nextTitle = `Destino del Mes ${monthUpper}`;
      if (promo.title !== nextTitle) {
        title = nextTitle;
        changed = true;
      }
      if (!promo.validUntil.includes(month) || !promo.validUntil.includes(String(new Date().getFullYear()))) {
        until = validUntil;
        changed = true;
      }
    }

    if (/^Travel SALE/i.test(promo.title)) {
      const nextTitle = `Travel SALE ${monthUpper}`;
      if (promo.title !== nextTitle) {
        title = nextTitle;
        changed = true;
      }
      if (!promo.validUntil.includes(month)) {
        until = validUntil;
        changed = true;
      }
    }

    if (changed) {
      await db.promotion.update({
        where: { id: promo.id },
        data: { title, validUntil: until },
      });
    }
  }
}
