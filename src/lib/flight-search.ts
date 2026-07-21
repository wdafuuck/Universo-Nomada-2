export type FlightOption = {
  id: string;
  airline: string;
  outbound: string;
  inbound: string;
  /** Solo uso interno (filtro); no mostrar al cliente */
  price: number;
  stops: number;
};

type SearchParams = {
  tourId: string;
  departDate: string;
  returnDate: string;
  adults: number;
  maxBudget: number;
};

const AIRLINES = ["LATAM", "Sky Airline", "JetSMART", "Copa Airlines", "Avianca"];

function mockFlightPrice(params: SearchParams, index: number): number {
  const seed = params.departDate.split("-").join("") + params.tourId.length;
  const base = 180000 + (Number(seed) % 120000);
  return Math.round(base * (1 + index * 0.12));
}

/** Horarios mock — solo fechas donde ida+vuerta ≤ maxBudget. */
export function searchFlightOptions(params: SearchParams): FlightOption[] {
  if (!params.maxBudget || params.maxBudget <= 0) return [];

  return AIRLINES.slice(0, 4)
    .map((airline, i) => ({
      id: `flt-${params.tourId}-${params.departDate}-${i}`,
      airline,
      outbound: `${params.departDate} · ${6 + i}:30 → ${11 + i}:45`,
      inbound: `${params.returnDate} · ${14 + i}:00 → ${19 + i}:30`,
      price: mockFlightPrice(params, i),
      stops: i > 1 ? 1 : 0,
    }))
    .filter((o) => o.price <= params.maxBudget);
}

/** Fechas donde existe al menos un vuelo ida+vuelta dentro del tope. */
export function allowedDatesInRange(
  tourId: string,
  from: string,
  to: string,
  returnNights: number,
  adults: number,
  maxBudget: number | null,
): string[] {
  if (!maxBudget || maxBudget <= 0) return [];

  const allowed: string[] = [];
  const start = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const ret = new Date(d);
    ret.setDate(ret.getDate() + returnNights);
    const returnDate = ret.toISOString().slice(0, 10);
    const opts = searchFlightOptions({
      tourId,
      departDate: iso,
      returnDate,
      adults,
      maxBudget,
    });
    if (opts.length > 0) allowed.push(iso);
  }
  return allowed;
}
