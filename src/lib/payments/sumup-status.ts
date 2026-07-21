type SumUpCheckout = {
  id?: string;
  status?: string;
  checkout_reference?: string;
  amount?: number;
};

export async function getSumUpCheckoutByReference(reference: string): Promise<SumUpCheckout | null> {
  const apiKey = process.env.SUMUP_API_KEY?.trim();
  if (!apiKey) return null;

  const res = await fetch(
    `https://api.sumup.com/v0.1/checkouts?checkout_reference=${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
  );

  if (!res.ok) return null;

  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.items ?? data?.checkouts ?? [];
  if (!Array.isArray(list) || list.length === 0) return null;

  return list[0] as SumUpCheckout;
}

export async function getSumUpCheckoutById(id: string): Promise<SumUpCheckout | null> {
  const apiKey = process.env.SUMUP_API_KEY?.trim();
  if (!apiKey) return null;

  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json() as Promise<SumUpCheckout>;
}

export function isSumUpCheckoutPaid(checkout: SumUpCheckout | null): boolean {
  if (!checkout) return false;
  const status = (checkout.status ?? "").toUpperCase();
  return status === "PAID" || status === "SUCCESSFUL" || status === "SUCCESS";
}
