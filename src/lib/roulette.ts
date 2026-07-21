import type { PrismaClient } from "@prisma/client";
import { applyDiscountToTotal } from "@/lib/discount-codes";
import { normalizeEmail } from "@/lib/normalize-email";
import {
  getRouletteDiscount,
  roulettePrizeHasBenefit,
  type RoulettePrizeId,
} from "@/lib/roulette-shared";

export * from "@/lib/roulette-shared";

const PRIZE_WEIGHTS: { prize: RoulettePrizeId; weight: number; segmentIndices: number[] }[] = [
  { prize: "discount_5", weight: 12, segmentIndices: [0] },
  { prize: "kit_viajero", weight: 10, segmentIndices: [1] },
  { prize: "no_luck", weight: 43, segmentIndices: [2, 7] },
  { prize: "tour_regalo", weight: 10, segmentIndices: [3] },
  { prize: "discount_50000", weight: 5, segmentIndices: [4] },
  { prize: "regalo_sorpresa", weight: 10, segmentIndices: [5] },
  { prize: "discount_7", weight: 10, segmentIndices: [6] },
];

/** Solo server/API — no importar desde componentes cliente */
export function pickRandomRouletteOutcome(): { prize: RoulettePrizeId; segmentIndex: number } {
  const total = PRIZE_WEIGHTS.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  for (const entry of PRIZE_WEIGHTS) {
    roll -= entry.weight;
    if (roll <= 0) {
      const segmentIndex =
        entry.segmentIndices.length === 1
          ? entry.segmentIndices[0]
          : entry.segmentIndices[Math.floor(Math.random() * entry.segmentIndices.length)];
      return { prize: entry.prize, segmentIndex };
    }
  }
  return { prize: "no_luck", segmentIndex: 6 };
}

export type RouletteSpinRecord = {
  id: number;
  email: string;
  nombre: string;
  telefono: string;
  prize: string;
  redeemed: boolean;
  expiresAt: Date;
  leadId: number | null;
};

export async function findActiveRouletteSpin(
  db: PrismaClient,
  spinId: number,
  email?: string,
): Promise<RouletteSpinRecord | null> {
  const row = await db.rouletteSpin.findUnique({ where: { id: spinId } });
  if (!row || row.redeemed) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  if (email && normalizeEmail(email) !== normalizeEmail(row.email)) return null;
  return row;
}

export async function findActiveRouletteSpinByEmail(
  db: PrismaClient,
  email: string,
): Promise<RouletteSpinRecord | null> {
  const row = await db.rouletteSpin.findUnique({ where: { email: normalizeEmail(email) } });
  if (!row || row.redeemed) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  if (!roulettePrizeHasBenefit(row.prize as RoulettePrizeId)) return null;
  return row;
}

export function applyRouletteDiscount(
  cartTotal: number,
  prize: RoulettePrizeId,
): { discountedTotal: number; discountAmount: number } | null {
  const discount = getRouletteDiscount(prize);
  if (!discount) return null;
  return applyDiscountToTotal(cartTotal, discount.type, discount.value);
}

export function renderRouletteGiftEmailHtml(prize: RoulettePrizeId, giftTourName?: string): string {
  if (prize === "kit_viajero") {
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:12px;margin:20px 0;">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 6px;color:#5b21b6;font-size:12px;font-weight:700;text-transform:uppercase;">🎁 Premio ruleta</p>
        <p style="margin:0;color:#312e81;font-size:14px;line-height:1.6;">Ganaste un <strong>kit viajero de regalo</strong>. El equipo de Universo Nómada se pondrá en contacto contigo para coordinar el envío.</p>
      </td></tr>
    </table>`;
  }
  if (prize === "regalo_sorpresa") {
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fdf2f8;border:1px solid #f9a8d4;border-radius:12px;margin:20px 0;">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 6px;color:#9d174d;font-size:12px;font-weight:700;text-transform:uppercase;">🎁 Premio ruleta</p>
        <p style="margin:0;color:#831843;font-size:14px;line-height:1.6;">Ganaste un <strong>regalo sorpresa</strong>. El equipo de Universo Nómada se pondrá en contacto contigo para coordinar la entrega.</p>
      </td></tr>
    </table>`;
  }
  if (prize === "tour_regalo") {
    const tourLine = giftTourName
      ? `Incluimos tu <strong>tour adicional de regalo: ${giftTourName}</strong> sin costo extra en tu reserva.`
      : "Ganaste un <strong>tour adicional de regalo</strong>. El equipo de Universo Nómada se pondrá en contacto contigo para que elijas cuál incluir en tu viaje.";
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff7ed;border:1px solid #fdba74;border-radius:12px;margin:20px 0;">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 6px;color:#c2410c;font-size:12px;font-weight:700;text-transform:uppercase;">🎁 Premio ruleta</p>
        <p style="margin:0;color:#7c2d12;font-size:14px;line-height:1.6;">${tourLine}</p>
      </td></tr>
    </table>`;
  }
  return "";
}
