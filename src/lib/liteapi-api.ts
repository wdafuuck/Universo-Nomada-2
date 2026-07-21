import { computeRatehawkSurchargePerPerson } from "@/lib/hotel-surcharge";

export type LiteapiSearchParams = {
  hotelIds: string[];
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  /** hotelId → tope USD habitación doble 2 pax */
  maxPricesUsd?: Record<string, number>;
};

export type LiteapiHotelResult = {
  hotelId: string;
  available: boolean;
  livePriceUsd?: number;
  maxPriceUsd?: number;
  withinCap?: boolean;
  surchargePerPerson?: number;
};

export type LiteapiAvailabilityResponse = {
  results: LiteapiHotelResult[];
  source: "liteapi" | "manual";
  message?: string;
};

type LiteapiMoney = { amount?: number; currency?: string };

type LiteapiRate = {
  retailRate?: { total?: LiteapiMoney[] };
  netRate?: { total?: LiteapiMoney[] };
};

type LiteapiRoomType = {
  rates?: LiteapiRate[];
};

type LiteapiHotelRates = {
  hotelId?: string;
  roomTypes?: LiteapiRoomType[];
};

function extractMinPriceUsd(hotel: LiteapiHotelRates): number | undefined {
  let min: number | undefined;

  for (const room of hotel.roomTypes ?? []) {
    for (const rate of room.rates ?? []) {
      const total = rate.retailRate?.total?.[0] ?? rate.netRate?.total?.[0];
      const amount = Number(total?.amount);
      const currency = total?.currency?.toUpperCase();
      if (!Number.isFinite(amount) || amount <= 0) continue;
      if (currency && currency !== "USD") continue;
      min = min == null ? amount : Math.min(min, amount);
    }
  }

  return min;
}

export async function checkLiteapiAvailability(
  params: LiteapiSearchParams,
): Promise<LiteapiAvailabilityResponse> {
  const apiKey = process.env.LITEAPI_API_KEY?.trim();
  const base = (process.env.LITEAPI_API_BASE ?? "https://api.liteapi.travel/v3.0").replace(/\/$/, "");

  if (!apiKey || params.hotelIds.length === 0) {
    return {
      source: "manual",
      message: "Configure LITEAPI_API_KEY en .env para verificación automática con LiteAPI.",
      results: params.hotelIds.map((hotelId) => ({ hotelId, available: true })),
    };
  }

  try {
    const res = await fetch(`${base}/hotels/rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        hotelIds: params.hotelIds,
        checkin: params.checkIn,
        checkout: params.checkOut,
        currency: "USD",
        guestNationality: process.env.LITEAPI_GUEST_NATIONALITY ?? "CL",
        occupancies: [
          {
            adults: Math.max(params.adults, 1),
            children: Array.from({ length: Math.max(params.children, 0) }, () => 10),
          },
        ],
      }),
    });

    const data = (await res.json()) as { data?: LiteapiHotelRates[]; error?: { message?: string } };

    if (!res.ok || data.error) {
      return {
        source: "liteapi",
        message: data.error?.message ?? `LiteAPI respondió ${res.status}`,
        results: params.hotelIds.map((hotelId) => ({ hotelId, available: false })),
      };
    }

    const byId = new Map<string, LiteapiHotelRates>();
    for (const hotel of data.data ?? []) {
      if (hotel.hotelId) byId.set(hotel.hotelId, hotel);
    }

    const results: LiteapiHotelResult[] = params.hotelIds.map((hotelId) => {
      const hotel = byId.get(hotelId);
      if (!hotel) return { hotelId, available: false };

      const livePriceUsd = extractMinPriceUsd(hotel);
      if (livePriceUsd == null) return { hotelId, available: false };

      const maxPriceUsd = params.maxPricesUsd?.[hotelId];
      if (maxPriceUsd == null || maxPriceUsd <= 0) {
        return { hotelId, available: true, livePriceUsd };
      }

      const withinCap = livePriceUsd <= maxPriceUsd;
      const surchargePerPerson = withinCap
        ? 0
        : computeRatehawkSurchargePerPerson(livePriceUsd, maxPriceUsd);

      return {
        hotelId,
        available: true,
        livePriceUsd,
        maxPriceUsd,
        withinCap,
        surchargePerPerson,
      };
    });

    return { results, source: "liteapi" };
  } catch {
    return {
      source: "liteapi",
      results: params.hotelIds.map((hotelId) => ({ hotelId, available: false })),
    };
  }
}
