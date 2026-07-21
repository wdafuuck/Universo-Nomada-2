import { BANK_TRANSFER } from "@/lib/bank-transfer";

export function computeBalanceDue(cartTotal: number, amountPaid: number): number {
  return Math.max(0, cartTotal - amountPaid);
}

/** Fecha límite para pagar el saldo: 2 semanas antes del inicio del viaje. */
export function balancePaymentDeadline(checkIn?: string | null): string | null {
  if (!checkIn?.trim()) return null;
  const [y, m, d] = checkIn.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  date.setDate(date.getDate() - BANK_TRANSFER.balanceDueWeeksBeforeTrip * 7);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatDateCL(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function daysUntilIso(iso: string): number {
  const target = new Date(`${iso}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function paymentSummary(input: {
  cartTotal: number;
  amountPaid: number;
  paymentPlan: string | null;
  paymentMethod: string | null;
  status: string;
  checkIn: string | null;
  expiresAt: string | null;
}) {
  const balanceDue = computeBalanceDue(input.cartTotal, input.amountPaid);
  const deadline = balanceDue > 0 ? balancePaymentDeadline(input.checkIn) : null;
  const deadlineDays = deadline ? daysUntilIso(deadline) : null;
  const isFullyPaid = balanceDue <= 0 && input.cartTotal > 0;
  const awaitingTransfer =
    input.status === "pendiente_transferencia"
    && input.paymentMethod === "transferencia"
    && input.amountPaid > 0
    && !isFullyPaid;

  return {
    balanceDue,
    balancePaymentDeadline: deadline,
    balancePaymentDeadlineLabel: deadline ? formatDateCL(deadline) : null,
    daysUntilBalanceDeadline: deadlineDays,
    isFullyPaid,
    awaitingTransfer,
    awaitingInitialTransfer: input.status === "pendiente_transferencia" && input.amountPaid > 0,
  };
}

export const CANCELLED_STATUSES = new Set(["cancelado"]);

export function isCancelledStatus(status: string): boolean {
  return CANCELLED_STATUSES.has(status);
}

/** Ocultar en Mi cuenta transferencias no confirmadas por el admin tras 24 h. */
export function shouldHidePendingTransferFromMember(
  input: {
    status: string;
    paymentMethod: string | null;
    createdAt: Date;
  },
  now = new Date(),
): boolean {
  if (input.status !== "pendiente_transferencia") return false;
  if (input.paymentMethod !== "transferencia") return false;
  const hideAt = new Date(
    input.createdAt.getTime() + BANK_TRANSFER.transferMemberHideAfterHours * 3_600_000,
  );
  return now >= hideAt;
}
