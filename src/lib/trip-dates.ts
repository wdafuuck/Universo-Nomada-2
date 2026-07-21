import { checkOutFromCheckIn } from "@/lib/tour-duration";

export type CartLineDateMeta = {
  checkIn: string | null;
  checkOut: string | null;
  duration: string | null;
  tourId: string | null;
};

export function getFirstCartLineMeta(cartJson: string | null): CartLineDateMeta {
  if (!cartJson) {
    return { checkIn: null, checkOut: null, duration: null, tourId: null };
  }

  try {
    const arr = JSON.parse(cartJson) as unknown;
    if (!Array.isArray(arr) || !arr[0]) {
      return { checkIn: null, checkOut: null, duration: null, tourId: null };
    }

    const raw = arr[0] as Record<string, unknown>;
    return {
      checkIn: typeof raw.checkIn === "string" ? raw.checkIn : null,
      checkOut: typeof raw.checkOut === "string" ? raw.checkOut : null,
      duration: typeof raw.duration === "string" ? raw.duration : null,
      tourId: typeof raw.tourId === "string" ? raw.tourId : null,
    };
  } catch {
    return { checkIn: null, checkOut: null, duration: null, tourId: null };
  }
}

/** Calcula fecha de regreso si hay inicio + duración (ej. 5D/4N → inicio + 4 noches). */
export function resolveCheckOutDate(
  checkIn?: string | null,
  checkOut?: string | null,
  duration?: string | null,
): string | null {
  if (checkOut?.trim()) return checkOut.trim();
  if (!checkIn?.trim()) return null;
  return checkOutFromCheckIn(checkIn.trim(), duration);
}

/** Fecha de fin del viaje (regreso) en ISO YYYY-MM-DD. */
export function resolveTripEndIso(
  checkIn?: string | null,
  checkOut?: string | null,
  duration?: string | null,
): string | null {
  return resolveCheckOutDate(checkIn, checkOut, duration);
}

export function resolveTripEndIsoFromCart(
  cartJson: string | null,
  durationOverride?: string | null,
): string | null {
  const meta = getFirstCartLineMeta(cartJson);
  const duration = meta.duration || durationOverride || null;
  return resolveTripEndIso(meta.checkIn, meta.checkOut, duration);
}

export function isoDateToEndOfDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function resolveTripEndDateFromCart(
  cartJson: string | null,
  durationOverride?: string | null,
): Date | null {
  const iso = resolveTripEndIsoFromCart(cartJson, durationOverride);
  return iso ? isoDateToEndOfDay(iso) : null;
}

export type LineWithDates = {
  checkIn?: string;
  checkOut?: string;
  duration?: string;
  tourId?: string;
};

export function enrichLineDates<T extends LineWithDates>(
  line: T,
  tourDuration?: string | null,
): T {
  const duration = line.duration?.trim() || tourDuration?.trim() || null;
  const checkOut = resolveCheckOutDate(line.checkIn, line.checkOut, duration) ?? line.checkOut;
  return {
    ...line,
    ...(duration ? { duration } : {}),
    ...(checkOut ? { checkOut } : {}),
  };
}

export function latestTripEndIsoFromLines(lines: LineWithDates[]): string | null {
  let latest: string | null = null;
  for (const line of lines) {
    const enriched = enrichLineDates(line);
    const end = resolveTripEndIso(enriched.checkIn, enriched.checkOut, enriched.duration);
    if (!end) continue;
    if (!latest || end > latest) latest = end;
  }
  return latest;
}
