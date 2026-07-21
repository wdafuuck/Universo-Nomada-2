import { isTripLeadSource } from "@/lib/trip-documents";
import {
  getFirstCartLineMeta,
  resolveCheckOutDate,
  resolveTripEndDateFromCart,
} from "@/lib/trip-dates";
import { leadToConfirmation, type ReservationConfirmation } from "@/lib/reservation-confirmation";
import {
  paymentSummary,
  isCancelledStatus,
  shouldHidePendingTransferFromMember,
} from "@/lib/reservation-payment";
import {
  getLastTripEndDate as getLastTripEndDateCore,
  hasActiveUpcomingTrip as hasActiveUpcomingTripCore,
  isBenefitsEligible as isBenefitsEligibleCore,
} from "@/lib/member-trip-eligibility";

export type MemberTrip = ReservationConfirmation & {
  status: string;
  destino: string | null;
  telefono: string;
  tripEndDate: string | null;
  checkIn: string | null;
  checkOut: string | null;
  isUpcoming: boolean;
  isPast: boolean;
  amountPaid: number;
  balancePaymentDeadline: string | null;
  balancePaymentDeadlineLabel: string | null;
  daysUntilBalanceDeadline: number | null;
  isFullyPaid: boolean;
};

type LeadRow = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  destino: string | null;
  status: string;
  source?: string;
  paymentMethod: string | null;
  paymentPlan: string | null;
  cartTotal: number | null;
  amountDue: number | null;
  expiresAt: Date | null;
  tripEndDate: Date | null;
  cartJson: string | null;
  confirmationEmailSentAt: Date | null;
  createdAt: Date;
};

const BOOKED_STATUSES = new Set([
  "reservado",
  "viajo",
  "pendiente_transferencia",
  "contactado",
  "cotizado",
]);

const UPCOMING_STATUSES = new Set([
  "reservado",
  "pendiente_transferencia",
  "contactado",
  "cotizado",
  "nuevo",
]);

function parseCartDates(cartJson: string | null): { checkIn: string | null; checkOut: string | null } {
  const meta = getFirstCartLineMeta(cartJson);
  const checkOut = resolveCheckOutDate(meta.checkIn, meta.checkOut, meta.duration);
  return {
    checkIn: meta.checkIn,
    checkOut,
  };
}

function resolveTripEnd(lead: LeadRow): Date | null {
  if (lead.tripEndDate) return lead.tripEndDate;
  return resolveTripEndDateFromCart(lead.cartJson);
}

function isUpcomingTrip(lead: LeadRow, now = new Date()): boolean {
  if (isCancelledStatus(lead.status)) return false;
  if (lead.status === "viajo") return false;
  if (!BOOKED_STATUSES.has(lead.status) && !isTripLeadSource(lead.source ?? "")) return false;

  const end = resolveTripEnd(lead);
  if (end && end < now) return false;

  if (UPCOMING_STATUSES.has(lead.status)) return true;

  const { checkIn } = parseCartDates(lead.cartJson);
  if (checkIn) {
    const start = new Date(checkIn);
    if (!Number.isNaN(start.getTime()) && start >= now) return true;
  }

  return isTripLeadSource(lead.source ?? "") && !end;
}

function isPastTrip(lead: LeadRow, now = new Date()): boolean {
  if (isCancelledStatus(lead.status)) return true;
  if (lead.status === "viajo") return true;
  const end = resolveTripEnd(lead);
  if (end && end < now) return true;
  return false;
}

export function leadToMemberTrip(lead: LeadRow & { source?: string }): MemberTrip | null {
  if (!lead.source || !isTripLeadSource(lead.source)) return null;
  if (shouldHidePendingTransferFromMember(lead)) return null;

  const base = leadToConfirmation(lead);
  const dates = parseCartDates(lead.cartJson);
  const end = resolveTripEnd(lead);
  const pay = paymentSummary({
    cartTotal: base.cartTotal,
    amountPaid: base.amountPaid,
    paymentPlan: lead.paymentPlan,
    paymentMethod: lead.paymentMethod,
    status: lead.status,
    checkIn: dates.checkIn,
    expiresAt: base.expiresAt,
  });

  return {
    ...base,
    status: lead.status,
    destino: lead.destino,
    telefono: lead.telefono,
    tripEndDate: end?.toISOString() ?? null,
    checkIn: dates.checkIn,
    checkOut: dates.checkOut,
    isUpcoming: isUpcomingTrip(lead),
    isPast: isPastTrip(lead),
    amountPaid: base.amountPaid,
    balancePaymentDeadline: pay.balancePaymentDeadline,
    balancePaymentDeadlineLabel: pay.balancePaymentDeadlineLabel,
    daysUntilBalanceDeadline: pay.daysUntilBalanceDeadline,
    isFullyPaid: pay.isFullyPaid,
  };
}

export function getLastTripEndDate(trips: MemberTrip[]): Date | null {
  return getLastTripEndDateCore(trips);
}

export function hasActiveUpcomingTrip(trips: MemberTrip[]): boolean {
  return hasActiveUpcomingTripCore(trips);
}

export function isBenefitsEligible(trips: MemberTrip[]): boolean {
  return isBenefitsEligibleCore(trips);
}
