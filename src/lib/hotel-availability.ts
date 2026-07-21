import type { AvailabilityProvider } from "@/lib/tour-pricing";
import { resolveAvailabilityProvider } from "@/lib/resolve-availability-provider";
import { checkBookingAvailability } from "@/lib/booking-api";
import { checkLiteapiAvailability } from "@/lib/liteapi-api";
import { checkRatehawkAvailability } from "@/lib/ratehawk-api";

export { resolveAvailabilityProvider };
export type { AvailabilityProvider };

export type HotelAvailabilityStatus = {
  available: boolean;
  provider: AvailabilityProvider;
  withinCap?: boolean;
  livePriceUsd?: number;
  maxPriceUsd?: number;
  /** Recargo CLP por persona (hab. doble, base 2 pax) */
  surchargePerPerson?: number;
};

export type HotelAvailabilityRequest = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  accommodations: {
    id: string;
    provider: AvailabilityProvider;
    bookingPropertyId?: number | null;
    liteapiHotelId?: string | null;
    liteapiMaxPriceUsd?: number | null;
    ratehawkHotelId?: number | null;
    maxPriceUsd?: number | null;
  }[];
};

export type HotelAvailabilityResponse = {
  results: Record<string, HotelAvailabilityStatus>;
  source: "live" | "manual";
  message?: string;
};

export { computeRatehawkSurchargePerPerson, getUsdClpRate } from "@/lib/hotel-surcharge";

export async function checkHotelAvailability(
  params: HotelAvailabilityRequest,
): Promise<HotelAvailabilityResponse> {
  const results: Record<string, HotelAvailabilityStatus> = {};
  const bookingItems = params.accommodations.filter((a) => a.provider === "booking" && a.bookingPropertyId);
  const liteapiItems = params.accommodations.filter((a) => a.provider === "liteapi" && a.liteapiHotelId);
  const ratehawkItems = params.accommodations.filter((a) => a.provider === "ratehawk" && a.ratehawkHotelId);

  for (const acc of params.accommodations) {
    if (acc.provider === "manual") {
      results[acc.id] = { available: true, provider: "manual" };
    }
  }

  let source: HotelAvailabilityResponse["source"] = "live";
  let message: string | undefined;

  if (bookingItems.length > 0) {
    const bookingRes = await checkBookingAvailability({
      hotelIds: bookingItems.map((a) => a.bookingPropertyId!),
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: params.adults,
      children: params.children,
    });

    if (bookingRes.source === "manual") {
      source = "manual";
      message = bookingRes.message;
    }

    const byHotelId = new Map(bookingRes.results.map((r) => [r.hotelId, r]));
    for (const acc of bookingItems) {
      const hit = byHotelId.get(acc.bookingPropertyId!);
      results[acc.id] = {
        available: hit?.available ?? false,
        provider: "booking",
      };
    }
  }

  if (liteapiItems.length > 0) {
    const caps = Object.fromEntries(
      liteapiItems
        .filter((a) => a.liteapiMaxPriceUsd != null && a.liteapiMaxPriceUsd > 0)
        .map((a) => [a.liteapiHotelId!, a.liteapiMaxPriceUsd!]),
    );

    const liteapiRes = await checkLiteapiAvailability({
      hotelIds: liteapiItems.map((a) => a.liteapiHotelId!),
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: params.adults,
      children: params.children,
      maxPricesUsd: caps,
    });

    if (liteapiRes.source === "manual") {
      source = "manual";
      message = message ?? liteapiRes.message;
    }

    const byHotelId = new Map(liteapiRes.results.map((r) => [r.hotelId, r]));
    for (const acc of liteapiItems) {
      const hit = byHotelId.get(acc.liteapiHotelId!);
      if (!hit) {
        results[acc.id] = { available: false, provider: "liteapi" };
        continue;
      }
      results[acc.id] = {
        available: hit.available,
        provider: "liteapi",
        withinCap: hit.withinCap,
        livePriceUsd: hit.livePriceUsd,
        maxPriceUsd: hit.maxPriceUsd,
        surchargePerPerson: hit.surchargePerPerson,
      };
    }
  }

  if (ratehawkItems.length > 0) {
    const caps = Object.fromEntries(
      ratehawkItems
        .filter((a) => a.maxPriceUsd != null && a.maxPriceUsd > 0)
        .map((a) => [a.ratehawkHotelId!, a.maxPriceUsd!]),
    );

    const ratehawkRes = await checkRatehawkAvailability({
      hotelIds: ratehawkItems.map((a) => a.ratehawkHotelId!),
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      maxPricesUsd: caps,
    });

    if (ratehawkRes.source === "manual") {
      source = "manual";
      message = message ?? ratehawkRes.message;
    }

    const byHid = new Map(ratehawkRes.results.map((r) => [r.hid, r]));
    for (const acc of ratehawkItems) {
      const hit = byHid.get(acc.ratehawkHotelId!);
      if (!hit) {
        results[acc.id] = { available: false, provider: "ratehawk" };
        continue;
      }
      results[acc.id] = {
        available: hit.available,
        provider: "ratehawk",
        withinCap: hit.withinCap,
        livePriceUsd: hit.livePriceUsd,
        maxPriceUsd: hit.maxPriceUsd,
        surchargePerPerson: hit.surchargePerPerson,
      };
    }
  }

  return { results, source, message };
}
