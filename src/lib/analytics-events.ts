import { SITE_URL } from "@/lib/site-url";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";

function canTrack(): boolean {
  if (typeof window === "undefined") return false;
  return hasAnalyticsConsent();
}

type ItemPayload = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackViewItem(item: ItemPayload) {
  if (!canTrack()) return;
  const value = item.price * (item.quantity ?? 1);
  window.gtag?.("event", "view_item", {
    currency: "CLP",
    value,
    items: [{ item_id: item.item_id, item_name: item.item_name, price: item.price, quantity: 1 }],
  });
  window.fbq?.("track", "ViewContent", {
    content_ids: [item.item_id],
    content_name: item.item_name,
    value,
    currency: "CLP",
  });
}

export function trackGenerateLead(params: { source: string; value?: number }) {
  if (!canTrack()) return;
  window.gtag?.("event", "generate_lead", {
    currency: "CLP",
    value: params.value ?? 0,
    lead_source: params.source,
  });
  window.fbq?.("track", "Lead", {
    content_name: params.source,
    value: params.value ?? 0,
    currency: "CLP",
  });
}

export function trackAddToCart(item: ItemPayload) {
  if (!canTrack()) return;
  const value = item.price * (item.quantity ?? 1);
  window.gtag?.("event", "add_to_cart", {
    currency: "CLP",
    value,
    items: [{ item_id: item.item_id, item_name: item.item_name, price: item.price, quantity: 1 }],
  });
  window.fbq?.("track", "AddToCart", {
    content_ids: [item.item_id],
    content_name: item.item_name,
    value,
    currency: "CLP",
  });
}

export function trackBeginCheckout(items: ItemPayload[], total: number) {
  if (!canTrack()) return;
  window.gtag?.("event", "begin_checkout", {
    currency: "CLP",
    value: total,
    items: items.map((i) => ({
      item_id: i.item_id,
      item_name: i.item_name,
      price: i.price,
      quantity: i.quantity ?? 1,
    })),
  });
  window.fbq?.("track", "InitiateCheckout", {
    value: total,
    currency: "CLP",
    num_items: items.length,
  });
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  items: ItemPayload[];
}) {
  if (!canTrack()) return;
  window.gtag?.("event", "purchase", {
    transaction_id: params.transactionId,
    currency: "CLP",
    value: params.value,
    items: params.items.map((i) => ({
      item_id: i.item_id,
      item_name: i.item_name,
      price: i.price,
      quantity: i.quantity ?? 1,
    })),
  });
  window.fbq?.("track", "Purchase", {
    value: params.value,
    currency: "CLP",
    content_ids: params.items.map((i) => i.item_id),
  });
}

export function cartRecoveryUrl(): string {
  return `${SITE_URL}/#destinos`;
}
