import type { DepartureAvailability } from "@/lib/group-departure-availability";

export type GroupDeparture = {
  date: string;
  availabilityStatus: DepartureAvailability;
  /** @deprecated solo compatibilidad */
  spotsLeft?: number;
  totalSpots?: number;
};

export type GroupTrip = {
  name: string;
  tourId: string;
  duration: string;
  departures: GroupDeparture[];
  price: number;
  reservation: number;
  includes: string[];
  image: string;
  gradient: string;
};

export const GROUP_TRIPS: GroupTrip[] = [
  {
    name: "San Pedro de Atacama",
    tourId: "group-atacama",
    duration: "4D/3N",
    departures: [
      { date: "Del 25 al 28 de junio", availabilityStatus: "last_spots" },
      { date: "Del 16 al 19 de junio", availabilityStatus: "available" },
    ],
    price: 784000,
    reservation: 100000,
    includes: ["Vuelo", "Seguro", "Transfer", "Hotel + desayuno", "5 tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    image: "/images/atacama-new.png",
    gradient: "from-orange-500 to-red-600",
  },
  {
    name: "Uyuni",
    tourId: "group-uyuni",
    duration: "6D/5N",
    departures: [{ date: "Del 14 al 19 de Septiembre", availabilityStatus: "last_spots" }],
    price: 968700,
    reservation: 100000,
    includes: ["Vuelo + equipaje", "Seguro", "Transfer", "Hotel + desayuno + almuerzo + cena", "Tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    image: "/images/uyuni.png",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    name: "Rapa Nui",
    tourId: "group-rapa-nui",
    duration: "5D/4N",
    departures: [{ date: "Del 14 al 18 de agosto", availabilityStatus: "available" }],
    price: 1205000,
    reservation: 200000,
    includes: ["Vuelo + equipaje", "Seguro", "Transfer + collar de Flores", "Hotel + desayuno", "Tours", "Entradas", "Líder de grupo", "Acompañamiento durante todo el viaje"],
    image: "/images/rapanui.png",
    gradient: "from-purple-500 to-indigo-600",
  },
];

export const GROUP_TOUR_META: Record<string, { tourId: string; image: string }> = {
  "San Pedro de Atacama": { tourId: "group-atacama", image: "/images/atacama-new.png" },
  Uyuni: { tourId: "group-uyuni", image: "/images/uyuni.png" },
  "Rapa Nui": { tourId: "group-rapa-nui", image: "/images/rapanui.png" },
};
