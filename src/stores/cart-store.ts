import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PassengerCounts } from "@/lib/tour-pricing";

export type TravelerDetail = {
  fullName: string;
  documentId: string;
  birthDate: string;
  documentExpiry: string;
};

export type CartContact = {
  email: string;
  phone: string;
  phoneCountry: string;
};

export type CartItem = {
  cartLineId: string;
  tourId: string;
  tourName: string;
  image: string;
  passengers: PassengerCounts;
  accommodationId?: string;
  accommodationName?: string;
  /** Recargo CLP por persona por hotel sobre tope RateHawk */
  accommodationSurchargePerPerson?: number;
  checkIn?: string;
  checkOut?: string;
  roomTypeId: string;
  roomLabel: string;
  totalPrice: number;
  noFlight?: boolean;
  flightId?: string;
  flightLabel?: string;
  /** Monto descontado al elegir sin vuelo (interno, no mostrar al cliente) */
  flightReferenceDeduction?: number;
  noAccommodation?: boolean;
  travelers?: TravelerDetail[];
  contact?: CartContact;
  selectedOptionalTours?: string[];
  selectedAdditionalActivities?: string[];
  /** Si false, cada extra tiene cantidad de pasajeros propia */
  extrasForAllPassengers?: boolean;
  extraActivityPassengers?: {
    activityId: string;
    activityName: string;
    passengers: number;
  }[];
  /** Complementos elegidos para un tour (ej: cena + show de danzas) */
  selectedTourAddons?: {
    tourId: string;
    tourName: string;
    addonId: string;
    addonName: string;
    pricePerPerson: number;
    passengers?: number;
  }[];
  /** Tour adicional de regalo (ruleta) */
  rouletteGiftTourId?: string;
  rouletteGiftTourName?: string;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartLineId">) => void;
  removeItem: (cartLineId: string) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            { ...item, cartLineId: `${item.tourId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
          ],
        })),
      removeItem: (cartLineId) =>
        set((state) => ({ items: state.items.filter((i) => i.cartLineId !== cartLineId) })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + i.totalPrice, 0),
      count: () => get().items.length,
    }),
    { name: "un-cart" }
  )
);
