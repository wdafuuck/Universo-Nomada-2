import type { ReservationLineItem } from "@/lib/email/templates";

export type StoredCartItem = {
  tourName: string;
  checkIn?: string;
  checkOut?: string;
  accommodationName?: string;
  roomLabel?: string;
  passengers?: Partial<{ adults: number; children: number; infants: number; seniors: number }> | null;
  totalPrice: number;
};

export function buildReservationItems(items: StoredCartItem[]): ReservationLineItem[] {
  return items.map((item) => {
    const p = item.passengers ?? { adults: 1, children: 0, infants: 0, seniors: 0 };
    return {
      tourName: item.tourName,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      accommodationName: item.accommodationName,
      roomLabel: item.roomLabel,
      passengers:
        (Number(p.adults) || 0)
        + (Number(p.children) || 0)
        + (Number(p.infants) || 0)
        + (Number(p.seniors) || 0),
      totalPrice: item.totalPrice,
    };
  });
}

export function parseCartJson(cartJson: string | null | undefined): ReservationLineItem[] {
  if (!cartJson) return [];
  try {
    const items = JSON.parse(cartJson) as StoredCartItem[];
    if (!Array.isArray(items)) return [];
    return buildReservationItems(items);
  } catch {
    return [];
  }
}
