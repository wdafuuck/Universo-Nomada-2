import type { PassengerCounts } from "@/lib/tour-pricing";
import { normalizePassengers, totalPassengers } from "@/lib/tour-pricing";
import { enrichLineDates, latestTripEndIsoFromLines, isoDateToEndOfDay } from "@/lib/trip-dates";

export type EditableCartLine = {
  tourId?: string;
  tourName: string;
  checkIn?: string;
  checkOut?: string;
  duration?: string;
  accommodationName?: string;
  roomLabel?: string;
  totalPrice: number;
  passengers?: Partial<PassengerCounts>;
};

export function parseCartJsonRaw(json: string | null): EditableCartLine[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((raw) => {
      const item = raw as Record<string, unknown>;
      return {
        tourId: typeof item.tourId === "string" ? item.tourId : undefined,
        tourName: String(item.tourName ?? ""),
        checkIn: typeof item.checkIn === "string" ? item.checkIn : undefined,
        checkOut: typeof item.checkOut === "string" ? item.checkOut : undefined,
        duration: typeof item.duration === "string" ? item.duration : undefined,
        accommodationName: typeof item.accommodationName === "string" ? item.accommodationName : undefined,
        roomLabel: typeof item.roomLabel === "string" ? item.roomLabel : undefined,
        totalPrice: Number(item.totalPrice) || 0,
        passengers: item.passengers as Partial<PassengerCounts> | undefined,
      };
    });
  } catch {
    return [];
  }
}

export function buildCartJsonFromLines(lines: EditableCartLine[]): string {
  return serializeCartLines(lines, null);
}

export function serializeCartLines(lines: EditableCartLine[], originalJson: string | null): string {
  let original: Record<string, unknown>[] = [];
  try {
    const parsed = JSON.parse(originalJson ?? "[]") as unknown;
    if (Array.isArray(parsed)) original = parsed as Record<string, unknown>[];
  } catch {
    original = [];
  }

  const merged = lines.map((line, idx) => {
    const base = original[idx] ?? {};
    const passengers = normalizePassengers(line.passengers);
    const enriched = enrichLineDates(line, line.duration);
    return {
      ...base,
      tourId: enriched.tourId ?? base.tourId ?? "manual",
      tourName: enriched.tourName,
      checkIn: enriched.checkIn || undefined,
      checkOut: enriched.checkOut || undefined,
      duration: enriched.duration || undefined,
      accommodationName: enriched.accommodationName || undefined,
      roomLabel: enriched.roomLabel || "—",
      totalPrice: enriched.totalPrice,
      passengers,
    };
  });

  return JSON.stringify(merged);
}

export function destinationFromCart(lines: EditableCartLine[]): string {
  return lines.map((l) => l.tourName).filter(Boolean).join(", ");
}

export function tripEndDateFromCartLines(lines: EditableCartLine[]): Date | null {
  const iso = latestTripEndIsoFromLines(lines.map((l) => enrichLineDates(l)));
  return iso ? isoDateToEndOfDay(iso) : null;
}

export function passengersFromCart(lines: EditableCartLine[]): number {
  if (!lines.length) return 0;
  const first = lines[0];
  return totalPassengers(normalizePassengers(first.passengers));
}
