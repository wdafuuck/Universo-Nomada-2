import type { PrismaClient } from "@prisma/client";

export type DiscountType = "percent" | "fixed";

export type DiscountCodeRecord = {
  id: number;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  active: boolean;
  validUntil: Date | null;
};

export type AppliedDiscount = {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  discountedTotal: number;
  description: string;
};

export function normalizeDiscountCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function applyDiscountToTotal(
  cartTotal: number,
  type: DiscountType,
  value: number,
): { discountedTotal: number; discountAmount: number } {
  if (cartTotal <= 0 || value <= 0) {
    return { discountedTotal: cartTotal, discountAmount: 0 };
  }

  let discountAmount = 0;
  if (type === "percent") {
    const pct = Math.min(100, Math.max(0, value));
    discountAmount = Math.round(cartTotal * pct / 100);
  } else {
    discountAmount = Math.min(cartTotal, Math.round(value));
  }

  return {
    discountedTotal: Math.max(0, cartTotal - discountAmount),
    discountAmount,
  };
}

export function isDiscountCodeValid(row: DiscountCodeRecord, now = new Date()): boolean {
  if (!row.active) return false;
  if (row.validUntil && row.validUntil.getTime() < now.getTime()) return false;
  if (row.discountType === "percent" && (row.discountValue <= 0 || row.discountValue > 100)) return false;
  if (row.discountType === "fixed" && row.discountValue <= 0) return false;
  return true;
}

export async function findValidDiscountCode(
  db: PrismaClient,
  rawCode: string,
): Promise<DiscountCodeRecord | null> {
  const code = normalizeDiscountCode(rawCode);
  if (!code) return null;

  const row = await db.discountCode.findUnique({ where: { code } });
  if (!row || !isDiscountCodeValid(row)) return null;
  return row;
}

export function toAppliedDiscount(
  row: DiscountCodeRecord,
  cartTotal: number,
): AppliedDiscount {
  const discountType = row.discountType === "fixed" ? "fixed" : "percent";
  const { discountedTotal, discountAmount } = applyDiscountToTotal(
    cartTotal,
    discountType,
    row.discountValue,
  );

  return {
    code: row.code,
    discountType,
    discountValue: row.discountValue,
    discountAmount,
    discountedTotal,
    description: row.description,
  };
}

export function formatDiscountLabel(type: DiscountType, value: number): string {
  if (type === "percent") return `${value}%`;
  return `$${value.toLocaleString("es-CL")}`;
}
