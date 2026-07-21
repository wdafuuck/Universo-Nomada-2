import type { Accommodation, AvailabilityProvider } from "@/lib/tour-pricing";

/** Pure helper — safe for client bundles (no API keys). */
export function resolveAvailabilityProvider(acc: Accommodation): AvailabilityProvider {
  if (acc.availabilityProvider) return acc.availabilityProvider;
  if (acc.liteapiHotelId) return "liteapi";
  if (acc.ratehawkHotelId) return "ratehawk";
  if (acc.bookingPropertyId) return "booking";
  return "manual";
}

export type { AvailabilityProvider };
