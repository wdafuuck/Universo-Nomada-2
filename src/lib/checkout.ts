import { payingPassengers, normalizePassengers, type PassengerCounts } from "@/lib/tour-pricing";
import type { PaymentItem } from "@/lib/payments";
import { BANK_TRANSFER } from "@/lib/bank-transfer";

export type CartLineInput = {
  tourId: string;
  tourName: string;
  passengers?: Partial<PassengerCounts> | null;
  totalPrice: number;
  checkIn?: string;
  checkOut?: string;
  roomLabel?: string;
  accommodationName?: string;
  customerNote?: string;
  flightLabel?: string;
};

export function normalizeCartItems(items: CartLineInput[]): Array<CartLineInput & { passengers: PassengerCounts }> {
  return items.map((item) => ({
    ...item,
    passengers: normalizePassengers(item.passengers),
    roomLabel: item.roomLabel ?? "—",
  }));
}

export type TourDepositInfo = {
  tourId: string;
  minDepositPerPerson: number;
};

const MS_DAY = 86_400_000;

export function daysUntilDate(isoDate: string): number {
  const target = new Date(`${isoDate}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / MS_DAY);
}

/** Depósito mínimo no disponible si el viaje es en ≤ 2 semanas */
export function canUseDepositForCart(items: CartLineInput[]): boolean {
  const dated = items.filter((i) => i.checkIn?.trim());
  if (dated.length === 0) return true;
  const minDays = Math.min(...dated.map((i) => daysUntilDate(i.checkIn!)));
  return minDays > BANK_TRANSFER.balanceDueWeeksBeforeTrip * 7;
}

export function calculateDepositAmount(
  items: Array<CartLineInput & { passengers: PassengerCounts }>,
  tours: TourDepositInfo[],
): number {
  const byTour = Object.fromEntries(tours.map((t) => [t.tourId, t.minDepositPerPerson]));
  return items.reduce((sum, item) => {
    const minPerPerson = byTour[item.tourId] ?? 0;
    const pax = payingPassengers(item.passengers);
    return sum + minPerPerson * pax;
  }, 0);
}

export function chargeAmount(
  cartTotal: number,
  paymentPlan: "total" | "deposito",
  depositAmount: number,
): number {
  if (paymentPlan === "deposito") {
    return Math.min(depositAmount, cartTotal);
  }
  return cartTotal;
}

/** IVA incluido en precio afecto (Chile 19%) */
export function vatFromGrossAfecto(gross: number): number {
  return Math.round(gross * 19 / 119);
}

export function calculateVatAmount(
  items: PaymentItem[],
  chargeAmount: number,
  cartTotal: number,
): number {
  if (cartTotal <= 0 || chargeAmount <= 0) return 0;
  const ratio = chargeAmount / cartTotal;
  return items.reduce((vat, item) => {
    if (item.taxType !== "afecto") return vat;
    const itemTotal = item.unit_price * item.quantity;
    return vat + vatFromGrossAfecto(Math.round(itemTotal * ratio));
  }, 0);
}

export function hasMixedTaxTypes(items: PaymentItem[]): boolean {
  const types = new Set(items.map((i) => (i.taxType === "afecto" ? "afecto" : "exento")));
  return types.size > 1;
}

export function transferExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + BANK_TRANSFER.transferDeadlineHours * 3_600_000);
}
