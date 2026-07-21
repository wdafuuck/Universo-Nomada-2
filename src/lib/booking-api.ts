export type BookingAvailabilityRequest = {
  hotelIds: number[];
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
};

export type BookingAvailabilityResult = {
  hotelId: number;
  available: boolean;
  deepLink?: string;
  priceFrom?: number;
};

export type BookingAvailabilityResponse = {
  results: BookingAvailabilityResult[];
  source: "booking_api" | "manual";
  message?: string;
};

export async function checkBookingAvailability(
  params: BookingAvailabilityRequest
): Promise<BookingAvailabilityResponse> {
  const base = process.env.BOOKING_API_BASE ?? "https://demandapi.booking.com/3.1";
  const affiliateId = process.env.BOOKING_AFFILIATE_ID;
  const apiKey = process.env.BOOKING_API_KEY;

  if (!affiliateId || !apiKey || params.hotelIds.length === 0) {
    return {
      source: "manual",
      message: "Configure BOOKING_AFFILIATE_ID y BOOKING_API_KEY para verificación automática.",
      results: params.hotelIds.map((id) => ({ hotelId: id, available: true })),
    };
  }

  const results: BookingAvailabilityResult[] = [];

  for (const hotelId of params.hotelIds) {
    try {
      const res = await fetch(`${base}/accommodations/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Affiliate-Id": affiliateId,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          accommodation: hotelId,
          booker: { country: "cl", platform: "desktop" },
          checkin: params.checkIn,
          checkout: params.checkOut,
          guests: {
            number_of_adults: Math.max(params.adults, 1),
            number_of_children: params.children,
            number_of_rooms: 1,
          },
        }),
      });

      if (!res.ok) {
        results.push({ hotelId, available: false });
        continue;
      }

      const data = await res.json();
      const products = data?.data?.products ?? data?.products ?? [];
      const available = Array.isArray(products) && products.length > 0;
      const deepLink = data?.data?.url ?? data?.url;
      const priceFrom = data?.data?.recommendation?.price?.total?.amount
        ?? products[0]?.price?.total?.amount;

      results.push({ hotelId, available, deepLink, priceFrom });
    } catch {
      results.push({ hotelId, available: false });
    }
  }

  return { results, source: "booking_api" };
}
