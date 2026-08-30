import { isCancelledStatus } from "@/lib/reservation-payment";
import {
  getFirstCartLineMeta,
  resolveCheckOutDate,
  resolveTripEndDateFromCart,
} from "@/lib/trip-dates";

export type AdminLeadTripDates = {
  checkIn: string | null;
  checkOut: string | null;
  tripStartMs: number | null;
  tripEndMs: number | null;
};

export type AdminCalendarTraveler = {
  userId: string;
  leadId: number;
  name: string;
  email: string;
  destino: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

function parseDayMs(isoDate: string): number | null {
  const m = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

export function leadTripDates(lead: {
  cartJson?: string | null;
  tripEndDate?: Date | string | null;
}): AdminLeadTripDates {
  const meta = getFirstCartLineMeta(lead.cartJson ?? null);
  const checkIn = meta.checkIn;
  const checkOut =
    resolveCheckOutDate(meta.checkIn, meta.checkOut, meta.duration) ??
    (lead.tripEndDate
      ? (typeof lead.tripEndDate === "string"
          ? lead.tripEndDate.slice(0, 10)
          : lead.tripEndDate.toISOString().slice(0, 10))
      : null);

  const tripStartMs = checkIn ? parseDayMs(checkIn) : null;
  let tripEndMs = checkOut ? parseDayMs(checkOut) : null;
  if (tripEndMs == null && lead.tripEndDate) {
    const end =
      typeof lead.tripEndDate === "string"
        ? new Date(lead.tripEndDate)
        : lead.tripEndDate;
    if (!Number.isNaN(end.getTime())) {
      tripEndMs = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12).getTime();
    }
  }
  if (tripEndMs == null && lead.cartJson) {
    const fromCart = resolveTripEndDateFromCart(lead.cartJson);
    if (fromCart) {
      tripEndMs = new Date(
        fromCart.getFullYear(),
        fromCart.getMonth(),
        fromCart.getDate(),
        12,
      ).getTime();
    }
  }

  return { checkIn, checkOut, tripStartMs, tripEndMs };
}

/** Próximo viaje activo (inicio >= hoy o en curso). */
export function nextUpcomingLead<T extends {
  status: string;
  destino: string | null;
  cartJson?: string | null;
  tripEndDate?: Date | string | null;
}>(
  leads: T[],
  now = new Date(),
): (T & AdminLeadTripDates) | null {
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime();
  const ranked = leads
    .filter((l) => !isCancelledStatus(l.status))
    .map((l) => ({ ...l, ...leadTripDates(l) }))
    .filter((l) => l.tripStartMs != null)
    .filter((l) => {
      const end = l.tripEndMs ?? l.tripStartMs!;
      return end >= todayMs; // aún no terminó
    })
    .sort((a, b) => (a.tripStartMs! - b.tripStartMs!));

  return ranked[0] ?? null;
}

export function buildCalendarTravelers(
  users: {
    id: string;
    name: string | null;
    email: string;
    leads: {
      id: number;
      status: string;
      destino: string | null;
      cartJson?: string | null;
      tripEndDate?: Date | string | null;
    }[];
  }[],
): AdminCalendarTraveler[] {
  const out: AdminCalendarTraveler[] = [];
  for (const user of users) {
    for (const lead of user.leads) {
      if (isCancelledStatus(lead.status)) continue;
      const dates = leadTripDates(lead);
      if (!dates.checkIn || !dates.checkOut) continue;
      out.push({
        userId: user.id,
        leadId: lead.id,
        name: (user.name || user.email.split("@")[0] || "Cliente").trim(),
        email: user.email,
        destino: (lead.destino || "Viaje").trim(),
        checkIn: dates.checkIn.slice(0, 10),
        checkOut: dates.checkOut.slice(0, 10),
        status: lead.status,
      });
    }
  }
  return out.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

/** Días inclusive YYYY-MM-DD desde checkIn hasta checkOut. */
export function eachDayInclusive(checkIn: string, checkOut: string): string[] {
  const start = parseDayMs(checkIn);
  const end = parseDayMs(checkOut);
  if (start == null || end == null || end < start) return [checkIn.slice(0, 10)];
  const days: string[] = [];
  for (let t = start; t <= end; t += 24 * 60 * 60 * 1000) {
    const d = new Date(t);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

export function formatDayLabel(iso: string): string {
  const ms = parseDayMs(iso);
  if (ms == null) return iso;
  return new Date(ms).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}
