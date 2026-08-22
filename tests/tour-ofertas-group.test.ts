import { describe, expect, it } from "vitest";
import { destinationBaseKey, tourIdStem } from "@/lib/tour-destination-groups";
import { groupPromosByDestination } from "@/lib/tour-ofertas";
import type { PromoCard } from "@/hooks/use-tours";

function promo(partial: Partial<PromoCard> & Pick<PromoCard, "tourId" | "title" | "subtitle">): PromoCard {
  return {
    id: 1,
    discount: "15% OFF",
    destination: "Peru",
    duration: "5 dias",
    validUntil: "",
    originalPrice: 100,
    discountPrice: 85,
    emoji: "🔥",
    image: "/x.jpg",
    ...partial,
  };
}

describe("agrupar ofertas por destino", () => {
  it("tourIdStem quita -copy y duración", () => {
    expect(tourIdStem("cusco-machupicchu-copy")).toBe("cusco-machupicchu");
    expect(tourIdStem("rapa-nui-7d")).toBe("rapa-nui");
    expect(tourIdStem("san-pedro-uyuni-7")).toBe("san-pedro-uyuni");
  });

  it("destinationBaseKey unifica cusco 5d y 7d copy", () => {
    const a = destinationBaseKey("Cusco + Machu Picchu", "cusco-machupicchu");
    const b = destinationBaseKey("Cusco + Machu Picchu", "cusco-machupicchu-copy");
    expect(a).toBe(b);
  });

  it("groupPromosByDestination une dos ofertas Cusco en una card", () => {
    const groups = groupPromosByDestination([
      promo({
        tourId: "cusco-machupicchu",
        title: "DESTINO DEL MES AGOSTO",
        subtitle: "Cusco + Machu Picchu",
        duration: "5 dias",
        discountPrice: 80,
      }),
      promo({
        tourId: "cusco-machupicchu-copy",
        title: "DESTINO DEL MES AGOSTO",
        subtitle: "Cusco + Machu Picchu",
        duration: "7 dias",
        discountPrice: 100,
      }),
      promo({
        tourId: "rapa-nui",
        title: "Rapa Nui",
        subtitle: "Isla de Pascua",
        duration: "5 dias",
      }),
    ]);
    expect(groups).toHaveLength(2);
    const cusco = groups.find((g) => g.promos.some((p) => (p.tourId ?? "").includes("cusco")));
    expect(cusco?.promos).toHaveLength(2);
    expect(cusco?.promos.map((p) => p.duration)).toEqual(["5 dias", "7 dias"]);
  });
});
