/** Consulta Aviasales/Travelpayouts — solo lectura, sin reserva automática.
 *
 * Importante: la Data API NO es un inventario GDS completo (como Google Flights).
 * Devuelve tarifas cacheadas de búsquedas recientes en Aviasales (pocas por ruta).
 * Por eso Lima u otras rutas pueden mostrar pocas opciones aunque el tope sea alto.
 */

import { addDaysToIso, daysBetweenIso } from "@/lib/tour-duration";

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
  flight_number?: string | number;
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

type PricesForDatesRow = {
  price: number;
  airline?: string;
  departure_at: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  gate?: string;
  flight_number?: string | number;
  origin_airport?: string;
  destination_airport?: string;
};

type PriceRangeRow = {
  price: number;
  airline?: string;
  departure_at: string;
  return_at?: string;
  transfers?: number;
  gate?: string;
  origin_airport?: string;
  destination_airport?: string;
};

const groupedMonthCache = new Map<string, { at: number; rows: Map<string, GroupedPriceRow> }>();
const weekMatrixCache = new Map<string, { at: number; rows: WeekMatrixRow[] }>();
const pricesForDatesCache = new Map<string, { at: number; rows: PricesForDatesRow[] }>();
const priceRangeCache = new Map<string, { at: number; rows: PriceRangeRow[] }>();
const CACHE_MS = 6 * 60 * 60 * 1000;

/** Máx. opciones a mostrar al cliente por fecha */
const MAX_FLIGHT_OPTIONS = 12;
/** Flexibilidad de noches vs duración del paquete (±) */
const NIGHTS_FLEX = 2;

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
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
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

function nightsBetween(departDate: string, returnDate: string): number {
  try {
    return daysBetweenIso(departDate, returnDate);
  } catch {
    return -1;
  }
}

function nightsMatchPackage(departDate: string, returnDate: string, nights: number): boolean {
  const n = nightsBetween(departDate, returnDate);
  if (n < 0) return false;
  return Math.abs(n - nights) <= NIGHTS_FLEX;
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

function uniqueMonths(from: string, to: string): string[] {
  const set = new Set<string>();
  for (const d of eachDateInRange(from, to)) set.add(d.slice(0, 7));
  return [...set];
}

function optionDedupeKey(o: LiveFlightOption): string {
  return `${o.airline}|${o.outbound}|${o.inbound}|${o.price}|${o.stops}`;
}

function dedupeAndSort(options: LiveFlightOption[]): LiveFlightOption[] {
  const seen = new Set<string>();
  const out: LiveFlightOption[] = [];
  for (const o of options.sort((a, b) => a.price - b.price || a.stops - b.stops)) {
    const key = optionDedupeKey(o);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
    if (out.length >= MAX_FLIGHT_OPTIONS) break;
  }
  return out;
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
    id: `tp-${origin}-${destination}-${departDate}-${idx}-${row.airline}-${row.flight_number ?? "x"}`,
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
  idx: number,
): LiveFlightOption {
  return {
    id: `tp-${origin}-${destination}-${row.depart_date}-wm-${idx}`,
    airline: row.gate ? `Vuelo · ${row.gate}` : "Vuelo incluido",
    outbound: formatDateShort(row.depart_date),
    inbound: formatDateShort(row.return_date),
    price: row.value,
    stops: row.number_of_changes ?? 0,
    indicative: false,
  };
}

function pricesRowToFlightOption(
  row: PricesForDatesRow | PriceRangeRow,
  origin: string,
  destination: string,
  idx: number,
): LiveFlightOption | null {
  const departDate = isoDateFromDeparture(row.departure_at);
  const returnDate = isoDateFromDeparture(row.return_at);
  if (!departDate || !returnDate) return null;
  const airlineCode = "airline" in row && row.airline ? String(row.airline) : "";
  const depTime = formatTime(row.departure_at.includes("T") ? row.departure_at : undefined);
  const retTime = formatTime(row.return_at?.includes("T") ? row.return_at : undefined);
  const flightNo = "flight_number" in row && row.flight_number != null ? String(row.flight_number) : "x";
  return {
    id: `tp-${origin}-${destination}-${departDate}-${idx}-${airlineCode || "xx"}-${flightNo}`,
    airline: airlineCode ? airlineDisplay(airlineCode) : row.gate ? `Vuelo · ${row.gate}` : "Vuelo incluido",
    outbound: `${formatDateShort(departDate)}${depTime ? ` · ${depTime}` : ""}`,
    inbound: `${formatDateShort(returnDate)}${retTime ? ` · ${retTime}` : ""}`,
    price: row.price,
    stops: row.transfers ?? 0,
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

async function fetchPricesForDatesMonth(params: {
  origin: string;
  destination: string;
  month: string;
}): Promise<PricesForDatesRow[]> {
  const token = getToken();
  if (!token) return [];

  const key = cacheKey("pfd", params.origin, params.destination, params.month);
  const cached = pricesForDatesCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rows;

  const url = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
  url.searchParams.set("origin", params.origin.toUpperCase());
  url.searchParams.set("destination", params.destination.toUpperCase());
  url.searchParams.set("departure_at", params.month);
  url.searchParams.set("return_at", params.month);
  url.searchParams.set("currency", "clp");
  url.searchParams.set("market", "cl");
  url.searchParams.set("sorting", "price");
  url.searchParams.set("one_way", "false");
  url.searchParams.set("unique", "false");
  url.searchParams.set("direct", "false");
  url.searchParams.set("limit", "100");
  url.searchParams.set("page", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-access-token": token },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { success?: boolean; data?: PricesForDatesRow[] };
    const rows = json.success && Array.isArray(json.data) ? json.data : [];
    pricesForDatesCache.set(key, { at: Date.now(), rows });
    return rows;
  } catch {
    return [];
  }
}

async function fetchByPriceRange(params: {
  origin: string;
  destination: string;
  maxBudget: number;
}): Promise<PriceRangeRow[]> {
  const token = getToken();
  if (!token) return [];

  const key = cacheKey("range", params.origin, params.destination, params.maxBudget);
  const cached = priceRangeCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rows;

  const url = new URL("https://api.travelpayouts.com/aviasales/v3/search_by_price_range");
  url.searchParams.set("origin", params.origin.toUpperCase());
  url.searchParams.set("destination", params.destination.toUpperCase());
  url.searchParams.set("value_min", "1");
  url.searchParams.set("value_max", String(Math.round(params.maxBudget)));
  url.searchParams.set("one_way", "false");
  url.searchParams.set("direct", "false");
  url.searchParams.set("locale", "es");
  url.searchParams.set("currency", "clp");
  url.searchParams.set("market", "cl");
  url.searchParams.set("limit", "30");
  url.searchParams.set("page", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-access-token": token },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { success?: boolean; data?: PriceRangeRow[] };
    const rows = json.success && Array.isArray(json.data) ? json.data : [];
    priceRangeCache.set(key, { at: Date.now(), rows });
    return rows;
  } catch {
    return [];
  }
}

/** Busca tarifas week-matrix para la duración del paquete (± flex). */
async function findMatrixFaresForNights(params: {
  origin: string;
  destination: string;
  departDate: string;
  nights: number;
  maxBudget: number;
}): Promise<WeekMatrixRow[]> {
  const targetReturn = addDaysToIso(params.departDate, params.nights);
  const matrix = await fetchWeekMatrix({
    origin: params.origin,
    destination: params.destination,
    departDate: params.departDate,
    returnDate: targetReturn,
  });

  return matrix.filter(
    (row) =>
      row.actual &&
      row.depart_date === params.departDate &&
      nightsMatchPackage(row.depart_date, row.return_date, params.nights) &&
      withinPerPersonBudget(row.value, params.maxBudget),
  );
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
  const origin = params.origin.toUpperCase();
  const destination = params.destination.toUpperCase();
  const month = params.departDate.slice(0, 7);
  const collected: LiveFlightOption[] = [];

  const [matrixRows, pricesRows, rangeRows, grouped] = await Promise.all([
    findMatrixFaresForNights({
      origin,
      destination,
      departDate: params.departDate,
      nights: params.nights,
      maxBudget: params.maxBudget,
    }),
    fetchPricesForDatesMonth({ origin, destination, month }),
    fetchByPriceRange({ origin, destination, maxBudget: params.maxBudget }),
    fetchGroupedPricesMonth({ origin, destination, month }),
  ]);

  matrixRows.forEach((row, i) => {
    collected.push(matrixRowToFlightOption(row, origin, destination, i));
  });

  let idx = 0;
  for (const row of pricesRows) {
    const dep = isoDateFromDeparture(row.departure_at);
    const ret = isoDateFromDeparture(row.return_at);
    if (dep !== params.departDate || !ret) continue;
    if (!nightsMatchPackage(dep, ret, params.nights)) continue;
    if (!withinPerPersonBudget(row.price, params.maxBudget)) continue;
    const opt = pricesRowToFlightOption(row, origin, destination, idx++);
    if (opt) collected.push(opt);
  }

  for (const row of rangeRows) {
    const dep = isoDateFromDeparture(row.departure_at);
    const ret = isoDateFromDeparture(row.return_at);
    if (dep !== params.departDate || !ret) continue;
    if (!nightsMatchPackage(dep, ret, params.nights)) continue;
    if (!withinPerPersonBudget(row.price, params.maxBudget)) continue;
    const opt = pricesRowToFlightOption(row, origin, destination, idx++);
    if (opt) collected.push(opt);
  }

  const detail = grouped.get(params.departDate);
  if (detail && withinPerPersonBudget(detail.price, params.maxBudget)) {
    const ret = isoDateFromDeparture(detail.return_at);
    if (!ret || nightsMatchPackage(params.departDate, ret, params.nights)) {
      collected.push(
        groupedRowToFlightOption(params.departDate, detail, idx++, origin, destination, detail.price),
      );
    }
  }

  return dedupeAndSort(collected);
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

  const origin = params.origin.toUpperCase();
  const destination = params.destination.toUpperCase();
  const rangeDates = new Set(eachDateInRange(params.from, params.to));
  const allowed = new Set<string>();

  const months = uniqueMonths(params.from, params.to);
  const [rangeRows, ...monthRows] = await Promise.all([
    fetchByPriceRange({ origin, destination, maxBudget: params.maxBudget }),
    ...months.map((month) => fetchPricesForDatesMonth({ origin, destination, month })),
  ]);

  const consider = (depart?: string | null, ret?: string | null, price?: number) => {
    if (!depart || !ret || !rangeDates.has(depart)) return;
    if (!withinPerPersonBudget(price ?? 0, params.maxBudget)) return;
    if (!nightsMatchPackage(depart, ret, params.nights)) return;
    allowed.add(depart);
  };

  for (const row of rangeRows) {
    consider(isoDateFromDeparture(row.departure_at), isoDateFromDeparture(row.return_at), row.price);
  }
  for (const rows of monthRows) {
    for (const row of rows) {
      consider(isoDateFromDeparture(row.departure_at), isoDateFromDeparture(row.return_at), row.price);
    }
  }

  // Completar con week-matrix solo para fechas aún no cubiertas.
  const missing = [...rangeDates].filter((d) => !allowed.has(d));
  const matrixHits = await Promise.all(
    missing.map(async (departDate) => {
      const fares = await findMatrixFaresForNights({
        origin,
        destination,
        departDate,
        nights: params.nights,
        maxBudget: params.maxBudget,
      });
      return fares.length ? departDate : null;
    }),
  );
  for (const d of matrixHits) {
    if (d) allowed.add(d);
  }

  return [...allowed].sort();
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
