import { computeRatehawkSurchargePerPerson } from "@/lib/hotel-surcharge";

export type RatehawkSearchParams = {
  hotelIds: number[];
  checkIn: string;
  checkOut: string;
  /** hid → tope USD habitación doble 2 pax */
  maxPricesUsd?: Record<number, number>;
};

export type RatehawkHotelResult = {
  hid: number;
  available: boolean;
  livePriceUsd?: number;
  maxPriceUsd?: number;
  withinCap?: boolean;
  surchargePerPerson?: number;
};

export type RatehawkAvailabilityResponse = {
  results: RatehawkHotelResult[];
  source: "ratehawk_api" | "manual";
  message?: string;
};

type RatehawkPaymentType = {
  show_amount?: string;
  show_currency_code?: string;
};

type RatehawkRate = {
  payment_options?: {
    payment_types?: RatehawkPaymentType[];
  };
};

type RatehawkHotel = {
  hid?: number;
  rates?: RatehawkRate[];
};

function extractMinPriceUsd(hotel: RatehawkHotel): number | undefined {
  const rates = hotel.rates ?? [];
  let min: number | undefined;

  for (const rate of rates) {
    for (const pt of rate.payment_options?.payment_types ?? []) {
      const amount = Number(pt.show_amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      min = min == null ? amount : Math.min(min, amount);
    }
  }

  return min;
}

export async function checkRatehawkAvailability(
  params: RatehawkSearchParams,
): Promise<RatehawkAvailabilityResponse> {
  const keyId = process.env.RATEHAWK_KEY_ID;
  const apiKey = process.env.RATEHAWK_API_KEY;
  const base =
    process.env.RATEHAWK_API_BASE ?? "https://api-sandbox.worldota.net/api/b2b/v3";
  const residency = process.env.RATEHAWK_RESIDENCY ?? "cl";

  if (!keyId || !apiKey || params.hotelIds.length === 0) {
    return {
      source: "manual",
      message:
        "Configure RATEHAWK_KEY_ID y RATEHAWK_API_KEY para verificación automática con RateHawk.",
      results: params.hotelIds.map((hid) => ({ hid, available: true })),
    };
  }

  const auth = Buffer.from(`${keyId}:${apiKey}`).toString("base64");

  try {
    const res = await fetch(`${base}/search/serp/hotels/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        checkin: params.checkIn,
        checkout: params.checkOut,
        residency,
        language: "es",
        currency: "USD",
        guests: [{ adults: 2, children: [] }],
        hids: params.hotelIds,
      }),
    });

    if (!res.ok) {
      return {
        source: "ratehawk_api",
        results: params.hotelIds.map((hid) => ({ hid, available: false })),
      };
    }

    const data = (await res.json()) as { data?: { hotels?: RatehawkHotel[] } };
    const hotels = data?.data?.hotels ?? [];
    const byHid = new Map<number, RatehawkHotel>();
    for (const hotel of hotels) {
      if (hotel.hid != null) byHid.set(hotel.hid, hotel);
    }

    const results: RatehawkHotelResult[] = params.hotelIds.map((hid) => {
      const hotel = byHid.get(hid);
      if (!hotel) return { hid, available: false };

      const livePriceUsd = extractMinPriceUsd(hotel);
      if (livePriceUsd == null) return { hid, available: false };

      const maxPriceUsd = params.maxPricesUsd?.[hid];
      if (maxPriceUsd == null || maxPriceUsd <= 0) {
        return { hid, available: true, livePriceUsd };
      }

      const withinCap = livePriceUsd <= maxPriceUsd;
      const surchargePerPerson = withinCap
        ? 0
        : computeRatehawkSurchargePerPerson(livePriceUsd, maxPriceUsd);

      return {
        hid,
        available: true,
        livePriceUsd,
        maxPriceUsd,
        withinCap,
        surchargePerPerson,
      };
    });

    return { results, source: "ratehawk_api" };
  } catch {
    return {
      source: "ratehawk_api",
      results: params.hotelIds.map((hid) => ({ hid, available: false })),
    };
  }
}
