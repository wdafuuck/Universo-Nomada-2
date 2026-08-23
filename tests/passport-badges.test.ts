import { describe, expect, it } from "vitest";
import {
  badgeMatchesTrip,
  computeEarnedBadges,
  type PassportBadgeDef,
} from "@/lib/passport-badges";
import type { MemberTrip } from "@/lib/member-trips";

function trip(partial: Partial<MemberTrip> & { destino: string }): MemberTrip {
  const tourName = partial.destino;
  return {
    leadId: "1",
    confirmationCode: "X",
    customerName: "Test",
    customerEmail: "t@t.com",
    telefono: "",
    status: "viajo",
    items: [{ tourName, passengers: { adults: 1, children: 0, infants: 0 }, totalPrice: 0 }],
    cartTotal: 0,
    amountPaid: 0,
    checkIn: null,
    checkOut: null,
    tripEndDate: "2026-01-10",
    isUpcoming: false,
    isPast: true,
    balancePaymentDeadline: null,
    balancePaymentDeadlineLabel: null,
    daysUntilBalanceDeadline: null,
    isFullyPaid: true,
    ...partial,
  } as MemberTrip;
}

/** Solo las insignias que el admin tiene creadas (no se inventan nuevas). */
const badges: PassportBadgeDef[] = [
  {
    id: 1,
    slug: "rio-de-janeiro",
    name: "Río de Janeiro",
    destination: "Río de Janeiro",
    description: "",
    image: "",
    emoji: "🇧🇷",
    matchTerms: ["rio de janeiro", "rio"],
  },
  {
    id: 3,
    slug: "cataratas-iguazu",
    name: "Cataratas del Iguazú",
    destination: "Cataratas del Iguazú",
    description: "",
    image: "",
    emoji: "💧",
    // Sin matchTerms explícitos: el matching usa tokens del nombre (iguazu)
    matchTerms: [],
  },
];

describe("passport multi-destino", () => {
  it("asocia Río e Iguazú desde un título compuesto sin crear insignias nuevas", () => {
    const t = trip({
      destino: "Rio de Janeiro, Ilha Grande e Iguazu",
    });
    const earned = computeEarnedBadges(badges, [t]);
    // Ilha Grande no está en el catálogo admin → no se otorga
    expect(earned.map((b) => b.slug).sort()).toEqual([
      "cataratas-iguazu",
      "rio-de-janeiro",
    ]);
  });

  it("«iguazu» en el viaje matchea la insignia Cataratas del Iguazú", () => {
    const t = trip({ destino: "Paquete Iguazu 5D/4N" });
    expect(badgeMatchesTrip(badges[1]!, t)).toBe(true);
  });
});
