import { describe, expect, it } from "vitest";
import {
  eachDayInclusive,
  leadTripDates,
  nextUpcomingLead,
} from "@/lib/admin-client-trips";

describe("admin-client-trips", () => {
  it("eachDayInclusive cubre 5 días 20→24", () => {
    expect(eachDayInclusive("2026-09-20", "2026-09-24")).toEqual([
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
    ]);
  });

  it("leadTripDates usa checkIn/checkOut del cart", () => {
    const d = leadTripDates({
      cartJson: JSON.stringify([{ checkIn: "2026-09-20", checkOut: "2026-09-24", duration: "5D/4N" }]),
    });
    expect(d.checkIn).toBe("2026-09-20");
    expect(d.checkOut).toBe("2026-09-24");
  });

  it("nextUpcomingLead elige el más cercano futuro", () => {
    const now = new Date("2026-08-30T12:00:00");
    const next = nextUpcomingLead(
      [
        {
          status: "reservado",
          destino: "Cusco",
          cartJson: JSON.stringify([{ checkIn: "2026-10-01", checkOut: "2026-10-07" }]),
        },
        {
          status: "reservado",
          destino: "Rapa Nui",
          cartJson: JSON.stringify([{ checkIn: "2026-09-20", checkOut: "2026-09-24" }]),
        },
        {
          status: "cancelado",
          destino: "X",
          cartJson: JSON.stringify([{ checkIn: "2026-09-01", checkOut: "2026-09-05" }]),
        },
      ],
      now,
    );
    expect(next?.destino).toBe("Rapa Nui");
    expect(next?.checkIn).toBe("2026-09-20");
  });
});
