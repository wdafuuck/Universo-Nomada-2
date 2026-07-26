import type { RoomOption } from "./room-options";
import { getRoomOptions } from "./room-options";

export type PassengerCounts = {
  adults: number;
  children: number;
  infants: number;
  seniors: number;
};

export type PassengerTypePrices = {
  adult: number;
  child: number;
  infant: number;
  senior: number;
};

export type OccupancyPricing = {
  passengerCount: number;
  prices: PassengerTypePrices;
};

export type AvailabilityProvider = "booking" | "ratehawk" | "liteapi" | "manual";

export type Accommodation = {
  id: string;
  name: string;
  /** Categoría hotelera 2–5 (null = no mostrar estrellas) */
  stars?: 2 | 3 | 4 | 5 | null;
  /** booking = solo cupo; liteapi/ratehawk = cupo + precio con tope opcional; manual = sin API */
  availabilityProvider?: AvailabilityProvider;
  bookingPropertyId?: number | null;
  bookingUrl?: string;
  /** ID LiteAPI / Nuitée Connect (ej. lp3803c) */
  liteapiHotelId?: string | null;
  /** Tope USD habitación doble 2 pax — LiteAPI */
  liteapiMaxPriceUsd?: number | null;
  /** ID numérico RateHawk (hid) */
  ratehawkHotelId?: number | null;
  /** Tope USD habitación doble 2 pax — si el precio real supera el tope, se cobra recargo */
  ratehawkMaxPriceUsd?: number | null;
  image?: string;
  /** Por defecto true si no está definido */
  includesBreakfast?: boolean;
  /** @deprecated usar occupancyPricing — se mantiene como fallback */
  prices: PassengerTypePrices;
  /** Precio por persona según 1, 2 o 3 viajeros pagantes */
  occupancyPricing?: OccupancyPricing[];
  active: boolean;
};

export type PricingTier = {
  passengers: number;
  pricePerPerson: number;
  roomOptions: RoomOption[];
};

export type TourPricingConfig = {
  tourId: string;
  tourName: string;
  basePrice: number;
  passengerPrices: PassengerTypePrices;
  occupancyPricing: OccupancyPricing[];
  accommodations: Accommodation[];
  tiers: PricingTier[];
  /**
   * % OFF de oferta (desde Tour.promoDiscountPercent).
   * Los precios guardados en hoteles son el precio normal; este % se aplica al cobrar/mostrar.
   */
  promoDiscountPercent?: number;
};

/** 0–90; valores inválidos → 0 */
export function clampPromoDiscountPercent(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(90, n);
}

export function applyPromoPercent(amount: number, percent: unknown): number {
  const p = clampPromoDiscountPercent(percent);
  const n = Number(amount) || 0;
  if (!p || n <= 0) return Math.round(n);
  return Math.round(n * (1 - p / 100));
}

export function scalePassengerPrices(
  prices: PassengerTypePrices,
  percent: unknown,
): PassengerTypePrices {
  const p = clampPromoDiscountPercent(percent);
  if (!p) return prices;
  return {
    adult: applyPromoPercent(prices.adult, p),
    child: applyPromoPercent(prices.child, p),
    infant: prices.infant,
    senior: applyPromoPercent(prices.senior, p),
  };
}

export function pricingWithoutPromo(config: TourPricingConfig): TourPricingConfig {
  if (!config.promoDiscountPercent) return config;
  return { ...config, promoDiscountPercent: 0 };
}

export function totalPassengers(p: PassengerCounts) {
  return p.adults + p.children + p.infants + p.seniors;
}

export function defaultPassengers(): PassengerCounts {
  return { adults: 1, children: 0, infants: 0, seniors: 0 };
}

export function normalizePassengers(p?: Partial<PassengerCounts> | null): PassengerCounts {
  if (!p) return defaultPassengers();
  return {
    adults: Math.max(0, Number(p.adults) || 0),
    children: Math.max(0, Number(p.children) || 0),
    infants: Math.max(0, Number(p.infants) || 0),
    seniors: Math.max(0, Number(p.seniors) || 0),
  };
}

export function payingPassengers(p: PassengerCounts) {
  return p.adults + p.children + p.seniors;
}

/** Viajes con tourId group-* no piden fechas en el carrito. */
export function isGroupTourId(tourId: string) {
  return tourId.startsWith("group-");
}

/** 1→1, 2→2, 3→3, 4+→2 (precio de pareja). */
export function occupancyBucket(payingCount: number): number {
  if (payingCount <= 1) return 1;
  if (payingCount === 3) return 3;
  return 2;
}

const emptyPrices = (): PassengerTypePrices => ({ adult: 0, child: 0, infant: 0, senior: 0 });

export function pricesFromAdultPerPerson(adult: number): PassengerTypePrices {
  return {
    adult,
    child: Math.round(adult * 0.7),
    infant: 0,
    senior: Math.round(adult * 0.9),
  };
}

export function ensureAccommodationOccupancy(
  acc: Accommodation,
  fallback: PassengerTypePrices,
): Accommodation {
  const base = acc.prices?.adult ? acc.prices : fallback;
  const occupancyPricing = [1, 2, 3].map((n) => {
    const existing = acc.occupancyPricing?.find((o) => o.passengerCount === n);
    if (existing?.prices?.adult) return existing;
    return { passengerCount: n, prices: { ...base } };
  });
  const occ2 = occupancyPricing.find((o) => o.passengerCount === 2)!;
  return { ...acc, occupancyPricing, prices: occ2.prices };
}

export function ensureAllAccommodationOccupancy(
  accommodations: Accommodation[],
  fallback: PassengerTypePrices,
): Accommodation[] {
  return accommodations.map((a) => ensureAccommodationOccupancy(a, fallback));
}

export function buildDefaultTiers(basePrice: number): PricingTier[] {
  return [1, 2, 3].map((n) => ({
    passengers: n,
    pricePerPerson: Math.round(basePrice * (n === 1 ? 1.15 : n === 2 ? 1 : 0.97)),
    roomOptions: getRoomOptions(n),
  }));
}

export function getAccommodationAdult2Pax(acc: Accommodation): number {
  const occ2 = acc.occupancyPricing?.find((o) => o.passengerCount === 2);
  if (occ2?.prices?.adult) return occ2.prices.adult;
  return acc.prices?.adult ?? 0;
}

export function getActiveAccommodations(config: TourPricingConfig): Accommodation[] {
  return config.accommodations.filter((a) => a.active);
}

/** Total del paquete con un alojamiento concreto (según pasajeros y bucket 1/2/3+). */
export function getAccommodationPackageTotal(
  config: TourPricingConfig,
  acc: Accommodation,
  passengers: PassengerCounts,
): number {
  return calculateTourTotal(config, passengers, acc.id);
}

/** Alojamientos visibles ordenados de más barato a más caro para la cantidad de pasajeros. */
export function sortAccommodationsByPrice(
  accommodations: Accommodation[],
  config: TourPricingConfig,
  passengers: PassengerCounts,
): Accommodation[] {
  return [...accommodations].sort((a, b) => {
    const diff =
      getAccommodationPackageTotal(config, a, passengers) -
      getAccommodationPackageTotal(config, b, passengers);
    if (diff !== 0) return diff;
    const perA = getEffectivePassengerPrices(config, passengers, a.id).adult;
    const perB = getEffectivePassengerPrices(config, passengers, b.id).adult;
    return perA - perB;
  });
}

export function getCheapestAccommodation2Pax(config: TourPricingConfig): Accommodation | null {
  const active = getActiveAccommodations(config).filter((a) => getAccommodationAdult2Pax(a) > 0);
  if (!active.length) return null;
  return active.reduce((best, acc) =>
    getAccommodationAdult2Pax(acc) < getAccommodationAdult2Pax(best) ? acc : best,
  );
}

export function usesAccommodationPricing(config: TourPricingConfig): boolean {
  return config.accommodations.length > 0;
}

export function syncPricingFromAccommodations(config: TourPricingConfig): TourPricingConfig {
  const cheapest = getCheapestAccommodation2Pax(config);
  if (!cheapest) return config;

  const adult2 = getAccommodationAdult2Pax(cheapest);
  const occupancyPricing = cheapest.occupancyPricing?.length
    ? cheapest.occupancyPricing
    : buildOccupancyPricing(adult2);
  const occ2 = occupancyPricing.find((o) => o.passengerCount === 2);

  return {
    ...config,
    basePrice: adult2,
    passengerPrices: occ2?.prices ?? pricesFromAdultPerPerson(adult2),
    occupancyPricing,
  };
}

export function getDisplayPricePerPerson(config: TourPricingConfig): number {
  const cheapest = getCheapestAccommodation2Pax(config);
  let list: number;
  if (cheapest) list = getAccommodationAdult2Pax(cheapest);
  else {
    const occ2 = config.occupancyPricing.find((o) => o.passengerCount === 2);
    list = occ2?.prices.adult || config.passengerPrices.adult || config.basePrice;
  }
  return applyPromoPercent(list, config.promoDiscountPercent);
}

/** Precio "Desde" sin aplicar % de oferta (precio de lista de hoteles). */
export function getListDisplayPricePerPerson(config: TourPricingConfig): number {
  return getDisplayPricePerPerson(pricingWithoutPromo(config));
}

export function getEffectivePassengerPrices(
  config: TourPricingConfig,
  passengers: PassengerCounts,
  accommodationId?: string
): PassengerTypePrices {
  const activeAccs = getActiveAccommodations(config);
  let raw: PassengerTypePrices | null = null;

  if (accommodationId) {
    const acc = config.accommodations.find((a) => a.id === accommodationId && a.active);
    if (acc) {
      const count = payingPassengers(passengers);
      const bucket = occupancyBucket(count);
      const occ = acc.occupancyPricing?.find((o) => o.passengerCount === bucket);
      if (occ?.prices?.adult) raw = occ.prices;
      else if (acc.prices?.adult) raw = acc.prices;
    }
  }

  if (!raw && activeAccs.length > 0) {
    return emptyPrices();
  }

  if (!raw) {
    const count = payingPassengers(passengers);
    const bucket = occupancyBucket(count);
    const occ = config.occupancyPricing.find((o) => o.passengerCount === bucket);
    raw = occ ? occ.prices : config.passengerPrices;
  }

  return scalePassengerPrices(raw, config.promoDiscountPercent);
}

export function calculateTourTotal(
  config: TourPricingConfig,
  passengers: PassengerCounts,
  accommodationId?: string
): number {
  const prices = getEffectivePassengerPrices(config, passengers, accommodationId);
  return (
    passengers.adults * prices.adult +
    passengers.children * prices.child +
    passengers.infants * prices.infant +
    passengers.seniors * prices.senior
  );
}

/** @deprecated use calculateTourTotal */
export function getPriceForPassengers(config: TourPricingConfig, count: number): number {
  if (count <= 0) return getDisplayPricePerPerson(config);
  const bucket = occupancyBucket(count);
  const occ = config.occupancyPricing.find((o) => o.passengerCount === bucket);
  const list = occ?.prices.adult
    ?? config.tiers.find((t) => t.passengers === bucket)?.pricePerPerson
    ?? config.tiers.filter((t) => t.passengers <= bucket).sort((a, b) => b.passengers - a.passengers)[0]?.pricePerPerson
    ?? config.passengerPrices.adult;
  return applyPromoPercent(list, config.promoDiscountPercent);
}

export function getRoomOptionsForTour(config: TourPricingConfig, count: number): RoomOption[] {
  const bucket = occupancyBucket(count);
  const tier = config.tiers.find((t) => t.passengers === bucket);
  if (tier?.roomOptions?.length) return tier.roomOptions;
  return getRoomOptions(bucket);
}

export function computeBasePrice(config: Partial<TourPricingConfig>, fallback: number): number {
  if (config.accommodations?.length) {
    const full = { ...createPricingConfig("", "", fallback), ...config } as TourPricingConfig;
    const cheapest = getCheapestAccommodation2Pax(full);
    if (cheapest) return getAccommodationAdult2Pax(cheapest);
  }
  const occ2 = config.occupancyPricing?.find((o) => o.passengerCount === 2);
  if (occ2?.prices?.adult) return occ2.prices.adult;
  if (config.passengerPrices?.adult) return config.passengerPrices.adult;
  return fallback;
}

function buildOccupancyPricing(basePrice: number): OccupancyPricing[] {
  return [1, 2, 3].map((n) => ({
    passengerCount: n,
    prices: {
      adult: Math.round(basePrice * (n === 1 ? 1.15 : n === 2 ? 1 : 0.97)),
      child: Math.round(basePrice * 0.7 * (n === 1 ? 1.15 : n === 2 ? 1 : 0.97)),
      infant: 0,
      senior: Math.round(basePrice * 0.9 * (n === 1 ? 1.15 : n === 2 ? 1 : 0.97)),
    },
  }));
}

export function ensureOccupancyTiers(config: TourPricingConfig, fallbackPrice: number): TourPricingConfig {
  const defaults = buildOccupancyPricing(fallbackPrice || config.basePrice);
  const occupancyPricing = [1, 2, 3].map((n) => {
    const existing = config.occupancyPricing.find((o) => o.passengerCount === n);
    return existing ?? defaults.find((o) => o.passengerCount === n)!;
  });
  return { ...config, occupancyPricing };
}

const RAPA_NUI_ACCOMMODATIONS: Accommodation[] = [
  { id: "rangi-moana", name: "Cabañas Rangi Moana", prices: { adult: 957100, child: 670000, infant: 0, senior: 860000 }, active: true },
  { id: "casa-kori", name: "Hostal La Casa del Kori", prices: { adult: 890000, child: 620000, infant: 0, senior: 800000 }, active: true },
  { id: "harepakoba", name: "Hostal Harepakoba", prices: { adult: 850000, child: 595000, infant: 0, senior: 765000 }, active: true },
  { id: "hotel-tupa", name: "Hotel Tupa", prices: { adult: 920000, child: 644000, infant: 0, senior: 828000 }, active: true },
  { id: "eco-lodge", name: "Hotel Easter Island Eco Lodge", prices: { adult: 980000, child: 686000, infant: 0, senior: 882000 }, active: true },
  { id: "uka-mana", name: "Hotel Uka Mana", prices: { adult: 1050000, child: 735000, infant: 0, senior: 945000 }, active: true },
];

export function createPricingConfig(tourId: string, tourName: string, basePrice: number): TourPricingConfig {
  const passengerPrices: PassengerTypePrices = {
    adult: basePrice,
    child: Math.round(basePrice * 0.7),
    infant: 0,
    senior: Math.round(basePrice * 0.9),
  };
  return {
    tourId,
    tourName,
    basePrice,
    passengerPrices,
    occupancyPricing: buildOccupancyPricing(basePrice),
    accommodations: tourId === "rapa-nui" ? RAPA_NUI_ACCOMMODATIONS : [],
    tiers: buildDefaultTiers(basePrice),
  };
}

export const DEFAULT_TOUR_PRICES: Record<string, number> = {
  "rapa-nui": 850000,
  "san-pedro-uyuni": 1658600,
  "cusco-machupicchu": 1200000,
  "terapias-ancestrales": 350000,
  "ballenas-elqui": 450000,
  "santiago-vinedos": 280000,
  "bolivia-amazonica": 980000,
  "region-atacama": 520000,
  "valle-aconcagua": 320000,
  "catedrales-marmol": 1500000,
  "rio-janeiro": 698000,
  "florianopolis": 593000,
  "buenos-aires": 450000,
  "mendoza": 586700,
  "group-atacama": 784000,
  "group-uyuni": 968700,
  "group-rapa-nui": 1205000,
};

export function normalizePricingConfig(raw: Partial<TourPricingConfig>, tourId: string, tourName: string, fallbackPrice: number): TourPricingConfig {
  const def = createPricingConfig(tourId, tourName, fallbackPrice);
  const passengerPrices = { ...def.passengerPrices, ...raw.passengerPrices };
  const merged: TourPricingConfig = {
    ...def,
    ...raw,
    tourId,
    tourName,
    passengerPrices,
    occupancyPricing: raw.occupancyPricing?.length ? raw.occupancyPricing : def.occupancyPricing,
    accommodations: ensureAllAccommodationOccupancy(
      raw.accommodations?.length ? raw.accommodations : def.accommodations,
      passengerPrices,
    ),
    tiers: raw.tiers?.length ? raw.tiers : def.tiers,
  };
  merged.basePrice = computeBasePrice(merged, fallbackPrice);
  merged.accommodations = ensureAllAccommodationOccupancy(merged.accommodations, merged.passengerPrices);
  const synced = usesAccommodationPricing(merged) ? syncPricingFromAccommodations(merged) : merged;
  return ensureOccupancyTiers(synced, fallbackPrice);
}

export function getDefaultPricing(tourId: string, tourName: string, fallbackPrice = 500000): TourPricingConfig {
  const base = DEFAULT_TOUR_PRICES[tourId] ?? fallbackPrice;
  return createPricingConfig(tourId, tourName, base);
}

/** Copia precios + alojamientos al duplicar un paquete (IDs de hotel únicos). */
export function clonePricingForDuplicate(
  source: Partial<TourPricingConfig>,
  newTourId: string,
  newTourName: string,
  fallbackPrice: number,
): TourPricingConfig {
  const cloned = JSON.parse(JSON.stringify(source)) as Partial<TourPricingConfig>;
  if (cloned.accommodations?.length) {
    cloned.accommodations = cloned.accommodations.map((acc, index) => ({
      ...acc,
      id: `${newTourId}-acc-${index}-${Date.now()}`,
    }));
  }
  return normalizePricingConfig(cloned, newTourId, newTourName, fallbackPrice);
}
