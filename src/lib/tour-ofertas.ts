import type { PromoCard } from "@/hooks/use-tours";
import { cleanDestinationName, tourIdStem } from "@/lib/tour-destination-groups";

export type TourOfertasRow = {
  tourId: string;
  name: string;
  subtitle: string;
  image: string;
  tag: string;
  duration: string;
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

/** Porcentaje escrito en el tag ("15% OFF", "-15%") para derivar el precio anterior. */
function tagDiscountPercent(tag: string): number | null {
  const m = tag.match(/(\d{1,2})\s*%/);
  if (!m) return null;
  const pct = Number(m[1]);
  return pct > 0 && pct < 90 ? pct : null;
}

/**
 * Precio anterior a tachar. Si el admin no cargó uno mayor al precio actual,
 * se deriva del porcentaje del tag para que el badge y el tachado coincidan.
 */
function resolveOriginalPrice(price: number, originalPrice: number | null, tag: string): number {
  if (originalPrice != null && originalPrice > price) return originalPrice;
  const pct = tagDiscountPercent(tag);
  if (pct && price > 0) return Math.round(price / (1 - pct / 100) / 100) * 100;
  return originalPrice != null && originalPrice > 0 ? originalPrice : price;
}

/** Mapea un Tour marcado para ofertas al shape que consume la home. */
export function tourToPromoCard(tour: TourOfertasRow): PromoCard {
  const title = tour.promoTitle.trim() || tour.name;
  const subtitle = tour.promoTitle.trim() ? tour.name : tour.subtitle || tour.name;
  const original = resolveOriginalPrice(tour.price, tour.originalPrice, tour.tag);

  return {
    id: tour.sortOrder * 1000 + tour.tourId.length,
    tourId: tour.tourId,
    title,
    subtitle,
    discount: discountLabel(tour.price, tour.originalPrice, tour.tag),
    destination: tour.subtitle || tour.name,
    duration: tour.duration,
    validUntil: "",
    originalPrice: original,
    discountPrice: tour.price,
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
  if (promo.tourId) return tourIdStem(promo.tourId);
  return cleanDestinationName(promo.subtitle || promo.title)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-");
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
