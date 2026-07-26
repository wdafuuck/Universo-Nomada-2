import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Valida x-signature de webhooks Mercado Pago.
 * Manifest: id:[data.id];request-id:[x-request-id];ts:[ts];
 * @see https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoWebhookSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  const secret = input.secret.trim();
  if (!secret || !input.xSignature?.trim()) return false;

  const parts = Object.fromEntries(
    input.xSignature.split(",").map((p) => {
      const [k, ...rest] = p.trim().split("=");
      return [k?.trim() ?? "", rest.join("=").trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifestParts: string[] = [];
  if (input.dataId) {
    manifestParts.push(`id:${String(input.dataId).toLowerCase()}`);
  }
  if (input.xRequestId) {
    manifestParts.push(`request-id:${input.xRequestId}`);
  }
  manifestParts.push(`ts:${ts}`);
  const manifest = `${manifestParts.join(";")};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(v1, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
