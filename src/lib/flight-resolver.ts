import { searchFlightOptions, type FlightOption } from "@/lib/flight-search";
import {
  allowedDatesFromCalendar,
  isTravelpayoutsConfigured,
  searchLiveFlights,
} from "@/lib/travelpayouts-flights";

type TourFlightConfig = {
  tourId: string;
  flightOrigin: string;
  flightDestination: string;
  flightBudgetMax: number | null;
  duration: string;
};

type SearchParams = {
  tour: TourFlightConfig;
  departDate: string;
  returnDate: string;
  adults: number;
  nights: number;
};

export type FlightSearchResult = {
  options: FlightOption[];
  returnDate: string;
  hasBudget: boolean;
  /** Monto de referencia del vuelo por persona (admin) — uso interno, no mostrar al cliente */
  flightReferenceAmount: number | null;
  source: "travelpayouts" | "mock" | "none";
  message?: string;
};

function shouldUseMockFlights(): boolean {
  return process.env.FLIGHTS_USE_MOCK === "true";
}

export async function resolveFlightSearch(params: SearchParams): Promise<FlightSearchResult> {
  const { tour, departDate, returnDate, adults, nights } = params;
  const maxBudget =
    tour.flightBudgetMax && tour.flightBudgetMax > 0 ? tour.flightBudgetMax : null;
  const origin = tour.flightOrigin?.trim().toUpperCase();
  const destination = tour.flightDestination?.trim().toUpperCase();

  if (!maxBudget) {
    return {
      options: [],
      returnDate,
      hasBudget: false,
      flightReferenceAmount: null,
      source: "none",
    };
  }

  if (!origin || !destination) {
    return {
      options: [],
      returnDate,
      hasBudget: true,
      flightReferenceAmount: maxBudget,
      source: "none",
      message: "Configura origen y destino del vuelo en el admin del paquete.",
    };
  }

  if (isTravelpayoutsConfigured()) {
    const live = await searchLiveFlights({
      origin,
      destination,
      departDate,
      returnDate,
      nights,
      adults,
      maxBudget,
    });

    return {
      options: live,
      returnDate,
      hasBudget: true,
      flightReferenceAmount: maxBudget,
      source: "travelpayouts",
      message: live.length
        ? "Elige el horario de ida y regreso que prefieras."
        : "No hay horarios para esta fecha. Elige otra fecha de ida.",
    };
  }

  if (shouldUseMockFlights()) {
    const mock = searchFlightOptions({
      tourId: tour.tourId,
      departDate,
      returnDate,
      adults,
      maxBudget,
    });

    return {
      options: mock,
      returnDate,
      hasBudget: true,
      flightReferenceAmount: maxBudget,
      source: "mock",
      message: mock.length
        ? "Elige el horario de ida y regreso que prefieras."
        : "No hay horarios para esta fecha.",
    };
  }

  return {
    options: [],
    returnDate,
    hasBudget: true,
    flightReferenceAmount: maxBudget,
    source: "none",
    message:
      "Vuelos en vivo no disponibles. Configura TRAVELPAYOUTS_TOKEN en el servidor.",
  };
}

export async function resolveAllowedDates(params: {
  tour: TourFlightConfig;
  from: string;
  to: string;
  adults: number;
  nights: number;
}): Promise<{ allowed: string[]; hasBudget: boolean; source: string; message?: string }> {
  const maxBudget =
    params.tour.flightBudgetMax && params.tour.flightBudgetMax > 0
      ? params.tour.flightBudgetMax
      : null;
  if (!maxBudget) return { allowed: [], hasBudget: false, source: "none" };

  const origin = params.tour.flightOrigin?.trim().toUpperCase();
  const destination = params.tour.flightDestination?.trim().toUpperCase();

  if (!origin || !destination) {
    return { allowed: [], hasBudget: true, source: "none" };
  }

  if (isTravelpayoutsConfigured()) {
    const allowed = await allowedDatesFromCalendar({
      origin,
      destination,
      from: params.from,
      to: params.to,
      nights: params.nights,
      adults: params.adults,
      maxBudget,
    });
    return {
      allowed,
      hasBudget: true,
      source: "travelpayouts",
      message: allowed.length
        ? undefined
        : "No hay fechas con vuelo dentro del tope configurado.",
    };
  }

  if (shouldUseMockFlights()) {
    const { allowedDatesInRange } = await import("@/lib/flight-search");
    return {
      allowed: allowedDatesInRange(
        params.tour.tourId,
        params.from,
        params.to,
        params.nights,
        params.adults,
        maxBudget,
      ),
      hasBudget: true,
      source: "mock",
    };
  }

  return {
    allowed: [],
    hasBudget: true,
    source: "none",
    message: "Configura TRAVELPAYOUTS_TOKEN para filtrar fechas por tope de vuelo.",
  };
}
