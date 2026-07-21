/** Consulta Aviasales/Travelpayouts — solo lectura, sin reserva automática. */

import { addDaysToIso } from "@/lib/tour-duration";

export type CalendarFlightDay = {
  date: string;
  price: number;
  airline: string;
  airlineName: string;
  transfers: number;
  departureAt?: string;
  returnAt?: string;
};

export type LiveFlightOption = {
  id: string;
  airline: string;
  outbound: string;
  inbound: string;
  price: number;
  stops: number;
  indicative: boolean;
};

const AIRLINE_NAMES: Record<string, string> = {
  LA: "LATAM",
  H2: "Sky Airline",
  JA: "JetSMART",
  CM: "Copa Airlines",
  AV: "Avianca",
  AR: "Aerolíneas Argentinas",
  G3: "GOL",
  AD: "Azul",
};

type GroupedPriceRow = {
  price: number;
  airline: string;
  departure_at: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  gate?: string;
};

type WeekMatrixRow = {
  depart_date: string;
  return_date: string;
  value: number;
  number_of_changes: number;
  actual: boolean;
  gate?: string;
  duration?: number;
};

const groupedMonthCache = new Map<string, { at: number; rows: Map<string, GroupedPriceRow> }>();
const weekMatrixCache = new Map<string, { at: number; rows: WeekMatrixRow[] }>();
const CACHE_MS = 6 * 60 * 60 * 1000;

function cacheKey(...parts: (string | number)[]) {
  return parts.join("-");
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function airlineDisplay(code: string): string {
  return AIRLINE_NAMES[code?.toUpperCase()] ?? code ?? "Aerolínea";
}

function getToken(): string | null {
  const token = process.env.TRAVELPAYOUTS_TOKEN?.trim();
  if (!token || token.length < 8) return null;
  return token;
}

/** Tope admin y precios API son por persona (ida + vuelta). */
function withinPerPersonBudget(perPersonPrice: number, maxBudgetPerPerson: number): boolean {
  return perPersonPrice > 0 && perPersonPrice <= maxBudgetPerPerson;
}

function isoDateFromDeparture(iso?: string): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function eachDateInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function groupedRowToFlightOption(
  departDate: string,
  row: GroupedPriceRow,
  idx: number,
  origin: string,
  destination: string,
  price: number,
): LiveFlightOption {
  const returnDate = isoDateFromDeparture(row.return_at) ?? departDate;
  const depTime = formatTime(row.departure_at);
  const retTime = formatTime(row.return_at);
  return {
    id: `tp-${origin}-${destination}-${departDate}-${idx}-${row.airline}`,
    airline: airlineDisplay(row.airline),
    outbound: `${formatDateShort(departDate)}${depTime ? ` · ${depTime}` : ""}`,
    inbound: `${formatDateShort(returnDate)}${retTime ? ` · ${retTime}` : ""}`,
    price,
    stops: row.transfers ?? 0,
    indicative: false,
  };
}

function matrixRowToFlightOption(
  row: WeekMatrixRow,
  origin: string,
  destination: string,
): LiveFlightOption {
  return {
    id: `tp-${origin}-${destination}-${row.depart_date}-wm`,
    airline: row.gate ? `Vuelo · ${row.gate}` : "Vuelo incluido",
    outbound: formatDateShort(row.depart_date),
    inbound: formatDateShort(row.return_date),
    price: row.value,
    stops: row.number_of_changes ?? 0,
    indicative: false,
  };
}

async function fetchGroupedPricesMonth(params: {
  origin: string;
  destination: string;
  month: string;
}): Promise<Map<string, GroupedPriceRow>> {
  const token = getToken();
  if (!token || !params.origin || !params.destination) return new Map();

  const key = cacheKey("grouped", params.origin, params.destination, params.month);
  const cached = groupedMonthCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rows;

  const url = new URL("https://api.travelpayouts.com/aviasales/v3/grouped_prices");
  url.searchParams.set("origin", params.origin.toUpperCase());
  url.searchParams.set("destination", params.destination.toUpperCase());
  url.searchParams.set("departure_at", params.month);
  url.searchParams.set("group_by", "departure_at");
  url.searchParams.set("currency", "clp");
  url.searchParams.set("market", "cl");
  url.searchParams.set("limit", "100");
  url.searchParams.set("one_way", "false");
  url.searchParams.set("direct", "false");

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-access-token": token },
      cache: "no-store",
    });
    if (!res.ok) return new Map();

    const json = (await res.json()) as { success?: boolean; data?: Record<string, GroupedPriceRow> };
    if (!json.success || !json.data) return new Map();

    const rows = new Map(Object.entries(json.data));
    groupedMonthCache.set(key, { at: Date.now(), rows });
    return rows;
  } catch {
    return new Map();
  }
}

/**
 * Matriz semanal (v2) — equivalente a ITA Matrix con noches fijas:
 * ida en departDate, regreso objetivo en departDate + nights.
 */
async function fetchWeekMatrix(params: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
}): Promise<WeekMatrixRow[]> {
  const token = getToken();
  if (!token) return [];

  const key = cacheKey(
    "week",
    params.origin,
    params.destination,
    params.departDate,
    params.returnDate,
  );
  const cached = weekMatrixCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rows;

  const url = new URL("https://api.travelpayouts.com/v2/prices/week-matrix");
  url.searchParams.set("origin", params.origin.toUpperCase());
  url.searchParams.set("destination", params.destination.toUpperCase());
  url.searchParams.set("depart_date", params.departDate);
  url.searchParams.set("return_date", params.returnDate);
  url.searchParams.set("currency", "clp");
  url.searchParams.set("show_to_affiliates", "true");

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-access-token": token },
      cache: "no-store",
    });
    if (!res.ok) return [];

    const json = (await res.json()) as { success?: boolean; data?: WeekMatrixRow[] };
    if (!json.success || !Array.isArray(json.data)) return [];

    weekMatrixCache.set(key, { at: Date.now(), rows: json.data });
    return json.data;
  } catch {
    return [];
  }
}

/** Busca vuelo ida+vuelta para X noches (como ITA Matrix). */
async function findMatrixFareForNights(params: {
  origin: string;
  destination: string;
  departDate: string;
  nights: number;
  maxBudget: number;
}): Promise<WeekMatrixRow | null> {
  const targetReturn = addDaysToIso(params.departDate, params.nights);
  const matrix = await fetchWeekMatrix({
    origin: params.origin,
    destination: params.destination,
    departDate: params.departDate,
    returnDate: targetReturn,
  });

  const match = matrix.find(
    (row) =>
      row.actual &&
      row.depart_date === params.departDate &&
      withinPerPersonBudget(row.value, params.maxBudget),
  );

  return match ?? null;
}

export async function searchLiveFlights(params: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  nights: number;
  adults: number;
  maxBudget: number;
}): Promise<LiveFlightOption[]> {
  const matrixRow = await findMatrixFareForNights({
    origin: params.origin,
    destination: params.destination,
    departDate: params.departDate,
    nights: params.nights,
    maxBudget: params.maxBudget,
  });

  if (!matrixRow) return [];

  const month = params.departDate.slice(0, 7);
  const grouped = await fetchGroupedPricesMonth({
    origin: params.origin,
    destination: params.destination,
    month,
  });
  const detail = grouped.get(params.departDate);

  if (detail && withinPerPersonBudget(detail.price, params.maxBudget)) {
    const option = groupedRowToFlightOption(
      params.departDate,
      detail,
      0,
      params.origin,
      params.destination,
      matrixRow.value,
    );
    const retTime = formatTime(detail.return_at);
    option.inbound = `${formatDateShort(matrixRow.return_date)}${retTime ? ` · ${retTime}` : ""}`;
    return [option];
  }

  return [matrixRowToFlightOption(matrixRow, params.origin, params.destination)];
}

export async function allowedDatesFromCalendar(params: {
  origin: string;
  destination: string;
  from: string;
  to: string;
  nights: number;
  adults: number;
  maxBudget: number;
}): Promise<string[]> {
  if (!getToken()) return [];

  const dates = eachDateInRange(params.from, params.to);
  const results = await Promise.all(
    dates.map(async (departDate) => {
      const fare = await findMatrixFareForNights({
        origin: params.origin,
        destination: params.destination,
        departDate,
        nights: params.nights,
        maxBudget: params.maxBudget,
      });
      return fare ? departDate : null;
    }),
  );

  return results.filter((d): d is string => !!d).sort();
}

export function isTravelpayoutsConfigured(): boolean {
  return !!getToken();
}

export async function fetchMonthCalendar(params: {
  origin: string;
  destination: string;
  month: string;
  lengthNights: number;
}): Promise<CalendarFlightDay[]> {
  const from = `${params.month}-01`;
  const end = new Date(`${params.month}-01T12:00:00`);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  const to = end.toISOString().slice(0, 10);

  const allowed = await allowedDatesFromCalendar({
    origin: params.origin,
    destination: params.destination,
    from,
    to,
    nights: params.lengthNights,
    adults: 1,
    maxBudget: Number.MAX_SAFE_INTEGER,
  });

  return allowed.map((date) => ({
    date,
    price: 0,
    airline: "",
    airlineName: "",
    transfers: 0,
  }));
}
