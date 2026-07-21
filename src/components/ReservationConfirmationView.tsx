"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2, Clock, Building2, Mail, MessageCircle, CreditCard, CalendarClock, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BANK_TRANSFER,
  buildTransferProofMailto,
  buildTransferProofWhatsApp,
} from "@/lib/bank-transfer";
import type { ReservationConfirmation } from "@/lib/reservation-confirmation";
import { balancePaymentDeadline, formatDateCL } from "@/lib/reservation-payment";
import { trackPurchase } from "@/lib/analytics-events";

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

type Props = {
  data: ReservationConfirmation;
};

export function ReservationConfirmationView({ data }: Props) {
  const isTransfer = data.paymentMethod === "transferencia";
  const checkIn = data.items[0]?.checkIn ?? null;
  const balanceDeadline = data.balanceDue > 0 ? balancePaymentDeadline(checkIn) : null;

  useEffect(() => {
    trackPurchase({
      transactionId: data.leadId,
      value: data.amountPaid,
      items: data.items.map((i) => ({
        item_id: i.tourName,
        item_name: i.tourName,
        price: i.totalPrice,
      })),
    });
  }, [data.leadId, data.amountPaid, data.items]);
  const expiresLabel = data.expiresAt
    ? new Date(data.expiresAt).toLocaleString("es-CL", {
        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Image
            src="/images/logo-un.png"
            alt="Universo Nómada"
            width={64}
            height={64}
            className="rounded-full mx-auto mb-4 ring-2 ring-white/30 shadow-lg"
          />
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-4">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            ¡Reserva realizada con éxito!
          </h1>
          <p className="text-teal-50 text-base sm:text-lg">
            Hola {data.customerName.split(" ")[0]}, tu reserva <strong>#{data.leadId}</strong> quedó registrada.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 -mt-4">
        {!data.emailSent && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              {!data.emailConfigured ? (
                <p>
                  <strong>Correo automático no configurado en el servidor.</strong> Guarda esta pantalla o toma captura.
                  El administrador debe completar las variables <code className="text-xs bg-amber-100 px-1 rounded">SMTP_HOST</code>,{" "}
                  <code className="text-xs bg-amber-100 px-1 rounded">SMTP_USER</code> y{" "}
                  <code className="text-xs bg-amber-100 px-1 rounded">SMTP_PASS</code> en el archivo .env y reiniciar el servidor.
                </p>
              ) : (
                <p>
                  No pudimos enviar el correo a <strong>{data.customerEmail}</strong>. Guarda esta pantalla;
                  también puedes escribirnos a {BANK_TRANSFER.email}.
                </p>
              )}
            </div>
          </div>
        )}

        {data.emailSent && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800">
            Enviamos una copia de esta confirmación a <strong>{data.customerEmail}</strong>.
          </div>
        )}

        {isTransfer ? (
          <>
            <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm uppercase tracking-wide mb-3">
                <Clock className="h-4 w-4" />
                Plazo para transferir
              </div>
              {data.hoursLeft != null && (
                <p className="text-4xl font-black text-amber-600">{data.hoursLeft} hora{data.hoursLeft !== 1 ? "s" : ""}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">Válido hasta {expiresLabel}</p>
              <p className="text-3xl font-black text-slate-900 mt-4">{formatCLP(data.amountPaid)}</p>
              <p className="text-xs text-slate-400 mt-1">Referencia: Reserva #{data.leadId}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-teal" />
                Datos bancarios
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["Razón social", BANK_TRANSFER.businessName],
                  ["RUT", BANK_TRANSFER.rut],
                  ["Banco", BANK_TRANSFER.bank],
                  ["Tipo cuenta", BANK_TRANSFER.accountType],
                  ["N° cuenta", BANK_TRANSFER.accountNumber],
                  ["Email", BANK_TRANSFER.email],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-xl px-4 py-3">
                    <dt className="text-slate-400 text-xs">{label}</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-slate-500 mt-4">
                Envía el comprobante a nuestro correo o WhatsApp para confirmar tu cupo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <Button asChild variant="outline" className="rounded-xl h-11 gap-2">
                  <a href={buildTransferProofMailto(data.amountPaid, data.leadId)}>
                    <Mail className="h-4 w-4" />
                    Enviar comprobante por email
                  </a>
                </Button>
                <Button asChild className="rounded-xl h-11 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white">
                  <a
                    href={buildTransferProofWhatsApp(data.amountPaid, data.leadId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp {BANK_TRANSFER.whatsappDisplay}
                  </a>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm uppercase tracking-wide mb-3">
              <CreditCard className="h-4 w-4" />
              Pago con tarjeta recibido
            </div>
            <p className="text-3xl font-black text-slate-900">{formatCLP(data.amountPaid)}</p>
            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
              Dentro de las próximas <strong>24 horas</strong>, nuestro equipo te contactará por
              <strong> correo electrónico</strong> o <strong>WhatsApp</strong> para enviarte los vouchers y documentos de tu viaje.
            </p>
            <Button asChild className="mt-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2">
              <a href={`https://wa.me/${BANK_TRANSFER.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Escríbenos por WhatsApp
              </a>
            </Button>
          </div>
        )}

        {data.paymentPlan === "deposito" && data.balanceDue > 0 && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex gap-3">
            <CalendarClock className="h-5 w-5 text-teal shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-teal-900">Saldo pendiente: {formatCLP(data.balanceDue)}</p>
              <p className="text-sm text-teal-800 mt-1">
                {balanceDeadline ? (
                  <>Debe estar pagado antes del <strong>{formatDateCL(balanceDeadline)}</strong> (2 semanas antes del viaje).</>
                ) : (
                  <>Debe estar pagado <strong>2 semanas antes del viaje</strong>.</>
                )}
                {" "}Te contactaremos para coordinar el saldo restante.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Resumen de tu experiencia</h2>
          <div className="space-y-4">
            {data.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div>
                  <p className="font-semibold text-slate-900">{item.tourName}</p>
                  {item.checkIn && item.checkOut && (
                    <p className="text-xs text-slate-500 mt-1">{item.checkIn} → {item.checkOut}</p>
                  )}
                  {item.accommodationName && (
                    <p className="text-xs text-slate-500">{item.accommodationName}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {item.passengers} viajero{item.passengers !== 1 ? "s" : ""}
                    {item.roomLabel ? ` · ${item.roomLabel}` : ""}
                  </p>
                </div>
                <p className="font-bold text-slate-900 shrink-0">{formatCLP(item.totalPrice)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-700">Total del paquete</span>
            <span className="text-xl font-black">{formatCLP(data.cartTotal)}</span>
          </div>
          {data.amountPaid < data.cartTotal && (
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-slate-500">Pagado ahora</span>
              <span className="font-semibold text-teal-700">{formatCLP(data.amountPaid)}</span>
            </div>
          )}
        </div>

        <div className="text-center pb-8">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
