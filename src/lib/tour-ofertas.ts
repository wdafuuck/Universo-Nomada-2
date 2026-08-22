import type { PromoCard } from "@/hooks/use-tours";
import {
  cleanDestinationName,
  destinationBaseKey,
} from "@/lib/tour-destination-groups";
import { resolveOfferPricing } from "@/lib/tour-pricing";
import { effectivePromoDiscountPercent, formatPromoEndLabel } from "@/lib/promo-schedule";

export type TourOfertasRow = {
  tourId: string;
  name: string;
  subtitle: string;
  image: string;
  tag: string;
  duration: string;
  price: number;
  originalPrice: number | null;
  promoDiscountPercent: number;
  showInOfertas: boolean;
  promoTitle: string;
  promoStartsAt?: Date | string | null;
  promoEndsAt?: Date | string | null;
  sortOrder: number;
};

function discountLabel(percent: number, price: number, originalPrice: number | null, tag: string): string {
  if (percent > 0) return `${percent}% OFF`;
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
  const percent = effectivePromoDiscountPercent(tour);
  const offer = resolveOfferPricing(tour.price, tour.originalPrice, percent);

  return {
    id: tour.sortOrder * 1000 + tour.tourId.length,
    tourId: tour.tourId,
    title,
    subtitle,
    discount: discountLabel(percent, offer.price, offer.originalPrice, tour.tag),
    destination: tour.subtitle || tour.name,
    duration: tour.duration,
    validUntil: formatPromoEndLabel(tour.promoEndsAt),
    originalPrice: offer.originalPrice ?? offer.price,
    discountPrice: offer.price,
    emoji: "🔥",
    image: tour.image,
  };
}

export type PromoDestinationGroup = {
  key: string;
  /** Título editorial de la promo (ej. "DESTINO DEL MES AGOSTO") */
  title: string;
  /** Nombre del destino, común a todas las variantes */
  destinationName: string;
  image: string;
  emoji: string;
  promos: PromoCard[];
};

function promoGroupKey(promo: PromoCard): string {
  // subtitle suele ser el nombre del paquete cuando hay promoTitle editorial
  const nameSource = promo.subtitle || promo.destination || promo.title;
  return destinationBaseKey(nameSource, promo.tourId);
}

function promoDurationDays(promo: PromoCard): number {
  const m = (promo.duration ?? "").match(/(\d+)\s*d/i);
  return m ? Number(m[1]) : 999;
}

/** Agrupa ofertas del mismo destino en una tarjeta con sus variantes de duración. */
export function groupPromosByDestination(promos: PromoCard[]): PromoDestinationGroup[] {
  const map = new Map<string, PromoCard[]>();
  const order: string[] = [];

  for (const promo of promos) {
    const key = promoGroupKey(promo);
    if (!map.has(key)) order.push(key);
    map.set(key, [...(map.get(key) ?? []), promo]);
  }

  return order.map((key) => {
    const list = [...(map.get(key) ?? [])].sort(
      (a, b) => promoDurationDays(a) - promoDurationDays(b) || a.discountPrice - b.discountPrice,
    );
    const lead = list[0];
    return {
      key,
      title: lead.title,
      destinationName: cleanDestinationName(lead.subtitle || lead.title) || lead.subtitle || lead.title,
      image: lead.image,
      emoji: lead.emoji,
      promos: list,
    };
  });
}
