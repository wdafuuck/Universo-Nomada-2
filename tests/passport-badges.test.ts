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

const badges: PassportBadgeDef[] = [
  {
    id: 1,
    slug: "rio-de-janeiro",
    name: "Río de Janeiro",
    destination: "Río de Janeiro",
    description: "",
    image: "",
    emoji: "🇧🇷",
    matchTerms: ["rio de janeiro", "rio-de-janeiro"],
  },
  {
    id: 2,
    slug: "ilha-grande",
    name: "Ilha Grande",
    destination: "Ilha Grande",
    description: "",
    image: "",
    emoji: "🏝️",
    matchTerms: ["ilha grande", "ilha-grande"],
  },
  {
    id: 3,
    slug: "iguazu",
    name: "Cataratas del Iguazú",
    destination: "Iguazú",
    description: "",
    image: "",
    emoji: "💧",
    matchTerms: ["iguazu", "iguazú", "cataratas"],
  },
];

describe("passport multi-destino", () => {
  it("otorga varias insignias desde un título compuesto", () => {
    const t = trip({
      destino: "Rio de Janeiro, Ilha Grande e Iguazu",
    });
    const earned = computeEarnedBadges(badges, [t]);
    expect(earned.map((b) => b.slug).sort()).toEqual([
      "iguazu",
      "ilha-grande",
      "rio-de-janeiro",
    ]);
  });

  it("matchTerms detecta cada destino", () => {
    const t = trip({ destino: "rio de janeiro, ilha grande e iguazu" });
    expect(badgeMatchesTrip(badges[0]!, t)).toBe(true);
    expect(badgeMatchesTrip(badges[1]!, t)).toBe(true);
    expect(badgeMatchesTrip(badges[2]!, t)).toBe(true);
  });
});
