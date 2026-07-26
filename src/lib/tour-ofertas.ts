import type { PromoCard } from "@/hooks/use-tours";

export type TourOfertasRow = {
  tourId: string;
  name: string;
  subtitle: string;
  image: string;
  tag: string;
  price: number;
  originalPrice: number | null;
  showInOfertas: boolean;
  promoTitle: string;
  sortOrder: number;
};

function discountLabel(price: number, originalPrice: number | null, tag: string): string {
  if (originalPrice != null && originalPrice > price && price > 0) {
    const pct = Math.round((1 - price / originalPrice) * 100);
    if (pct > 0 && pct < 100) return `${pct}% OFF`;
  }
  const t = tag.trim();
  if (t) return t;
  return "OFERTA";
}

/** Mapea un Tour marcado para ofertas al shape que consume la home. */
export function tourToPromoCard(tour: TourOfertasRow): PromoCard {
  const title = tour.promoTitle.trim() || tour.name;
  const subtitle = tour.promoTitle.trim() ? tour.name : tour.subtitle || tour.name;
  const original = tour.originalPrice != null && tour.originalPrice > 0 ? tour.originalPrice : tour.price;

  return {
    id: tour.sortOrder * 1000 + tour.tourId.length,
    tourId: tour.tourId,
    title,
    subtitle,
    discount: discountLabel(tour.price, tour.originalPrice, tour.tag),
    destination: tour.subtitle || tour.name,
    validUntil: "",
    originalPrice: original,
    discountPrice: tour.price,
    emoji: "🔥",
    image: tour.image,
  };
}
