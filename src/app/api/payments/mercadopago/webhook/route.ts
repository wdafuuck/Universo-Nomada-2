import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Webhook de Mercado Pago — confirma pagos y actualiza el lead asociado. */
export async function POST(request: NextRequest) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const topic = searchParams.get("topic") ?? searchParams.get("type");
    const id = searchParams.get("id") ?? searchParams.get("data.id");

    if (topic === "payment" && id) {
      const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (payRes.ok) {
        const payment = await payRes.json();
        const ref = payment.external_reference as string | undefined;
        const status = payment.status as string;

        const leadId = ref ? Number(ref) : NaN;
        if (Number.isFinite(leadId) && (status === "approved" || status === "pending")) {
          const lead = await db.lead.findUnique({ where: { id: leadId } });
          if (lead) {
            const note = `[MP ${status}] Pago #${id} — ${Number(payment.transaction_amount ?? 0).toLocaleString("es-CL")} CLP`;
            await db.lead.update({
              where: { id: leadId },
              data: {
                status: status === "approved" ? "pagado" : "pendiente_pago",
                mensaje: `${note}\n\n${lead.mensaje}`,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
