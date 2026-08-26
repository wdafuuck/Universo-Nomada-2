"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Trash2, ShoppingBag, Users, CreditCard, Loader2, MessageCircle, Tag, X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCartStore } from "@/stores/cart-store";
import { totalPassengers } from "@/lib/tour-pricing";
import { getReferralCode } from "@/components/ReferralCapture";
import { buildWhatsAppUrl } from "@/lib/translations";
import {
  getStoredRoulettePrize,
  clearStoredRoulettePrize,
} from "@/lib/roulette-client";
import {
  roulettePrizeLabel,
} from "@/lib/roulette-shared";
import { getStoredWelcomeDiscountCode } from "@/lib/welcome-discount";
import type { ReservationConfirmation } from "@/lib/reservation-confirmation";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics-events";
import { CheckoutTrustBar, PaymentMethodBadges } from "@/components/CheckoutTrustBar";
import { AvailabilityDisclaimer } from "@/components/AvailabilityDisclaimer";
import { gravitySpring } from "@/lib/motion-presets";

const STORAGE_KEY = "un-last-reservation";

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

type PricingInfo = {
  cartTotal: number;
  discountedTotal?: number;
  discountAmount?: number;
  discountCode?: string | null;
  roulettePrize?: string | null;
  rouletteDiscountAmount?: number;
  depositAmount: number;
  canUseDeposit: boolean;
  chargeTotal: number;
  chargeDeposit: number;
  cardProvider?: "sumup" | "mercadopago" | null;
  cardProviders?: ("sumup" | "mercadopago")[];
  clientChoosesGateway?: boolean;
  taxHint?: "exento" | "afecto" | "mixto";
};

type TransferResult = never;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PaymentMethod = "card" | "transferencia";
type CardGateway = "sumup" | "mercadopago";
type PaymentPlan = "total" | "deposito";

function OptionCard({
  selected,
  onClick,
  title,
  subtitle,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={gravitySpring}
      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
        disabled ? "opacity-40 cursor-not-allowed border-slate-100 bg-slate-50"
          : selected ? "border-teal bg-teal/5 shadow-sm shadow-teal/10"
            : "border-slate-100 hover:border-teal/40 bg-white"
      }`}
    >
      <p className="font-semibold text-sm text-slate-900 leading-snug">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
    </motion.button>
  );
}

export function CartSheet({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const c = t("cart");
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = items.reduce((s, i) => s + i.totalPrice, 0);

  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardGateway, setCardGateway] = useState<CardGateway>("sumup");
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>("total");
  const [availabilityAcknowledged, setAvailabilityAcknowledged] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const welcomePrefillDone = useRef(false);

  const storedRoulette = useMemo(() => (open ? getStoredRoulettePrize() : null), [open]);
  const rouletteSpinId = storedRoulette?.spinId ?? null;
  const roulettePrizeLabelText = storedRoulette
    ? roulettePrizeLabel(storedRoulette.prize)
    : null;

  const payerEmail = items.find((i) => i.contact?.email?.trim())?.contact?.email;
  const payerName = items.flatMap((i) => i.travelers ?? []).find((tr) => tr.fullName?.trim())?.fullName;
  const payerPhone = items.find((i) => i.contact?.phone?.trim())?.contact?.phone;

  // Prefill código de bienvenida NOMAD5 tras registrarse en el popup
  useEffect(() => {
    if (!open) {
      welcomePrefillDone.current = false;
      return;
    }
    if (items.length === 0 || welcomePrefillDone.current || appliedDiscountCode || rouletteSpinId) return;
    const welcome = getStoredWelcomeDiscountCode();
    if (!welcome) return;
    welcomePrefillDone.current = true;
    setDiscountInput(welcome);
    setApplyingDiscount(true);
    void fetch("/api/discount-codes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: welcome,
        cartTotal: total,
        email: payerEmail ?? undefined,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.discount?.code) {
          setAppliedDiscountCode(data.discount.code);
          setDiscountInput(data.discount.code);
        } else if (res.status === 409) {
          // Ya usado por este correo: no auto-aplicar
          setDiscountInput("");
        }
      })
      .catch(() => {})
      .finally(() => setApplyingDiscount(false));
  }, [open, items.length, appliedDiscountCode, rouletteSpinId, total, payerEmail]);

  const helpWhatsAppUrl = buildWhatsAppUrl(
    `${c.whatsappCartIntro ?? "Hola! Necesito ayuda con mi reserva:"}\n\n${items.map((i) => `• ${i.tourName}`).join("\n")}\n${c.total ?? "Total"}: ${formatCLP(total)}`,
  );

  const subtotal = pricing?.cartTotal ?? total;
  const discountAmount = pricing?.discountAmount ?? 0;
  const cartTotalAfterDiscount = pricing?.discountedTotal ?? subtotal;

  const chargeAmount = paymentPlan === "deposito" && pricing?.canUseDeposit
    ? pricing.chargeDeposit
    : pricing?.chargeTotal ?? cartTotalAfterDiscount;

  useEffect(() => {
    if (!open || items.length === 0) {
      setPricing(null);
      return;
    }
    setLoadingPricing(true);
    fetch("/api/cart/pricing-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        discountCode: rouletteSpinId ? null : appliedDiscountCode,
        rouletteSpinId,
        contactEmail: payerEmail,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.cartTotal != null) {
          setPricing(d);
          if (appliedDiscountCode && !d.discountCode) {
            setAppliedDiscountCode(null);
            toast.error(c.discountInvalid ?? "El código ya no es válido");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPricing(false));
  }, [open, items, appliedDiscountCode, rouletteSpinId, payerEmail, c.discountInvalid]);

  useEffect(() => {
    if (pricing && !pricing.canUseDeposit && paymentPlan === "deposito") {
      setPaymentPlan("total");
    }
  }, [pricing, paymentPlan]);

  useEffect(() => {
    if (!pricing) return;
    const allowed: CardGateway[] = (pricing.cardProviders?.length
      ? pricing.cardProviders
      : pricing.cardProvider
        ? [pricing.cardProvider]
        : ["sumup"]).filter((p): p is CardGateway => p === "sumup" || p === "mercadopago");
    const preferred =
      pricing.cardProvider && allowed.includes(pricing.cardProvider)
        ? pricing.cardProvider
        : allowed[0] ?? "sumup";
    setCardGateway(preferred);
  }, [pricing]);

  useEffect(() => {
    if (!open) setAvailabilityAcknowledged(false);
  }, [open]);

  useEffect(() => {
    if (!open || items.length === 0) return;
    trackBeginCheckout(
      items.map((i) => ({ item_id: i.tourId, item_name: i.tourName, price: i.totalPrice })),
      total,
    );
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || items.length === 0 || !payerEmail?.trim() || payerEmail === "carrito@universonomada.cl") return;
    const timer = setTimeout(() => {
      void fetch("/api/cart/abandon-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payerEmail,
          nombre: payerName ?? "",
          telefono: payerPhone ?? "",
          items,
          cartTotal: total,
        }),
      });
    }, 30_000);
    return () => clearTimeout(timer);
  }, [open, payerEmail, payerName, payerPhone, items, total]);

  const handleClose = (next: boolean) => {
    if (!next) {
      setDiscountInput("");
      setAppliedDiscountCode(null);
    }
    onOpenChange(next);
  };

  const applyDiscount = async () => {
    const code = discountInput.trim();
    if (!code) return;
    setApplyingDiscount(true);
    try {
      const res = await fetch("/api/discount-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          cartTotal: subtotal,
          email: payerEmail ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? c.discountInvalid ?? "Código inválido");
        return;
      }
      setAppliedDiscountCode(data.discount.code);
      setDiscountInput(data.discount.code);
      toast.success(c.discountApplied ?? "Descuento aplicado");
    } catch {
      toast.error(c.discountInvalid ?? "Código inválido");
    } finally {
      setApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscountCode(null);
    setDiscountInput("");
    toast.message(c.discountRemoved ?? "Código eliminado");
  };

  const goToConfirmation = (confirmation: ReservationConfirmation, accessToken?: string) => {
    trackPurchase({
      transactionId: String(confirmation.leadId),
      value: confirmation.amountPaid,
      items: confirmation.items.map((i) => ({
        item_id: i.tourName,
        item_name: i.tourName,
        price: i.totalPrice,
      })),
    });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(confirmation));
    clearCart();
    onOpenChange(false);
    const t = accessToken ? `&t=${encodeURIComponent(accessToken)}` : "";
    router.push(`/reserva/confirmacion?reserva=${confirmation.leadId}${t}`);
  };

  const handleConfirm = async () => {
    if (items.length === 0 || processing) return;

    if (!availabilityAcknowledged) {
      toast.error(
        c.availabilityDisclaimerAcceptRequired ??
          "Debes confirmar que entiendes la política de disponibilidad antes de pagar.",
      );
      return;
    }

    if (!payerEmail?.trim() || payerEmail === "carrito@universonomada.cl") {
      toast.error(c.contactEmailRequired ?? "Completa el correo de contacto al agregar al carrito.");
      return;
    }

    setProcessing(true);
    try {
      const checkoutRes = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          referralCode: getReferralCode(),
          discountCode: rouletteSpinId ? null : appliedDiscountCode,
          rouletteSpinId: rouletteSpinId ?? undefined,
          rouletteGiftTour: items.find((i) => i.rouletteGiftTourName)?.rouletteGiftTourName,
          paymentMethod: paymentMethod === "card" ? cardGateway : paymentMethod,
          paymentPlan,
          contact: {
            nombre: payerName ?? "Reserva carrito",
            email: payerEmail ?? "carrito@universonomada.cl",
            telefono: payerPhone ?? "pendiente",
          },
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        toast.error(checkoutData.error ?? c.checkoutError);
        return;
      }

      if (rouletteSpinId) clearStoredRoulettePrize();

      if (paymentMethod === "transferencia") {
        if (checkoutData.confirmation) {
          goToConfirmation(checkoutData.confirmation, checkoutData.accessToken);
        } else {
          goToConfirmation({
            leadId: checkoutData.leadId,
            customerName: payerName ?? "Viajero",
            customerEmail: payerEmail ?? "",
            paymentMethod: "transferencia",
            paymentPlan: paymentPlan,
            amountPaid: checkoutData.amount,
            cartTotal: checkoutData.cartTotal,
            balanceDue: Math.max(0, checkoutData.cartTotal - checkoutData.amount),
            expiresAt: checkoutData.transfer?.expiresAt ?? null,
            hoursLeft: checkoutData.transfer?.expiresAt
              ? Math.max(0, Math.round((new Date(checkoutData.transfer.expiresAt).getTime() - Date.now()) / 3_600_000))
              : null,
            items: [],
            emailSent: checkoutData.emailSent ?? false,
            emailConfigured: true,
          }, checkoutData.accessToken);
        }
        return;
      }

      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: checkoutData.amount,
          vatAmount: checkoutData.vatAmount,
          email: payerEmail,
          externalReference: checkoutData.leadId,
          description: `Reserva Universo Nómada — ${items.map((i) => i.tourName).join(", ")}`.slice(0, 255),
          items: checkoutData.paymentItems,
          provider: checkoutData.paymentMethod ?? checkoutData.cardProvider ?? cardGateway,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        toast.error(payData.error ?? c.payNotConfigured);
        return;
      }

      toast.message(c.payRedirecting ?? "Redirigiendo al pago seguro...");
      clearCart();
      handleClose(false);
      window.location.href = payData.redirectUrl;
    } catch {
      toast.error(c.checkoutError);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 px-0 pt-6 pb-0 h-full overflow-hidden">
        <SheetHeader className="px-6 sm:px-8 pt-0 pb-4 pr-12 space-y-1 shrink-0">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <ShoppingBag className="h-5 w-5 text-teal shrink-0" />
            {c.myCart}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {items.length === 0 ? c.empty : `${items.length} ${c.items}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 space-y-4 pb-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{c.emptyDesc}</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                {items.map((item, idx) => {
                  const pax = totalPassengers(item.passengers);
                  return (
                    <motion.div
                      key={item.cartLineId}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16, height: 0 }}
                      transition={{ delay: idx * 0.04, ...gravitySpring }}
                      className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/80"
                    >
                      <div className="relative h-[72px] w-[72px] rounded-xl overflow-hidden shrink-0">
                        <Image src={item.image} alt={item.tourName} fill className="object-cover" sizes="72px" />
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="font-semibold text-sm text-slate-900 leading-snug">{item.tourName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                          <Users className="h-3 w-3 shrink-0" /> {pax} {c.travelers}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.roomLabel}</p>
                        {item.accommodationSurchargePerPerson && item.accommodationSurchargePerPerson > 0 && (
                          <p className="text-xs text-amber-700 mt-0.5">
                            Recargo hotel: {formatCLP(item.accommodationSurchargePerPerson)}/persona
                          </p>
                        )}
                        {item.checkIn && item.checkOut && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.checkIn} → {item.checkOut}</p>
                        )}
                        {item.customerNote?.trim() && (
                          <p className="text-xs text-teal-800/80 mt-1 leading-snug bg-teal/5 rounded-md px-2 py-1">
                            Nota: {item.customerNote.trim()}
                          </p>
                        )}
                        <p className="text-black font-bold text-base mt-2">{formatCLP(item.totalPrice)}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(item.cartLineId)}
                        className="text-slate-400 hover:text-red-500 p-1.5 self-start shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              )}

            {items.length > 0 && (
              <div className="border-t border-slate-100 pt-6 mt-2 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    {c.discountCodeLabel ?? "Código de descuento"}
                  </p>
                  {rouletteSpinId && roulettePrizeLabelText && pricing?.rouletteDiscountAmount ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                      <div>
                        <p className="font-bold text-violet-900">🎁 {roulettePrizeLabelText}</p>
                        <p className="text-xs text-violet-700 mt-0.5">
                          {`${c.discountSaved ?? "Ahorras"} ${formatCLP(pricing.rouletteDiscountAmount)} — premio ruleta`}
                        </p>
                      </div>
                    </div>
                  ) : appliedDiscountCode ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div>
                        <p className="font-mono font-bold text-emerald-800">{appliedDiscountCode}</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          {`${c.discountSaved ?? "Ahorras"} ${formatCLP(discountAmount)} ${c.discountOnReservation ?? "en el total de la reserva"}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="text-emerald-700 hover:text-red-600 p-1"
                        aria-label={c.discountRemove ?? "Quitar código"}
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : rouletteSpinId && roulettePrizeLabelText ? (
                    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                      <p className="font-bold text-violet-900">🎁 {roulettePrizeLabelText}</p>
                      <p className="text-xs text-violet-700 mt-0.5">
                        Premio activo — completa tu reserva antes de que expire el tiempo.
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                        placeholder={c.discountCodePlaceholder ?? "Ej: VERANO2026"}
                        className="font-mono uppercase rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void applyDiscount();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void applyDiscount()}
                        disabled={applyingDiscount || !discountInput.trim()}
                        className="shrink-0 rounded-xl"
                      >
                        {applyingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : (c.discountApply ?? "Aplicar")}
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {c.paymentPlanLabel ?? "¿Cuánto deseas pagar?"}
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <OptionCard
                      selected={paymentPlan === "total"}
                      onClick={() => setPaymentPlan("total")}
                      title={c.payFull ?? "Pagar el total"}
                      subtitle={`${formatCLP(pricing?.chargeTotal ?? cartTotalAfterDiscount)}`}
                    />
                    <OptionCard
                      selected={paymentPlan === "deposito"}
                      onClick={() => setPaymentPlan("deposito")}
                      title={c.payMinimum ?? "Reservar con el mínimo"}
                      subtitle={
                        pricing?.canUseDeposit
                          ? `${formatCLP(pricing.chargeDeposit)} ahora · ${c.reservationBalance ?? "Saldo"} ${formatCLP(cartTotalAfterDiscount - pricing.chargeDeposit)}`
                          : c.depositNotAvailable ?? "No disponible (viaje en menos de 2 semanas o mínimo no configurado)"
                      }
                      disabled={!pricing?.canUseDeposit || loadingPricing}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {c.paymentMethodLabel ?? "Forma de pago"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <OptionCard
                      selected={paymentMethod === "card"}
                      onClick={() => setPaymentMethod("card")}
                      title={c.payCard ?? "Tarjeta de débito o crédito"}
                      subtitle={
                        pricing?.taxHint === "afecto"
                          ? "Viaje nacional (afecto a IVA) · elige pasarela abajo"
                          : pricing?.taxHint === "mixto"
                            ? "Incluye viaje internacional · pago con SumUp"
                            : (c.payCardHint ?? "Viaje internacional (exento) · pago con SumUp")
                      }
                    />
                    <OptionCard
                      selected={paymentMethod === "transferencia"}
                      onClick={() => setPaymentMethod("transferencia")}
                      title={c.bankTransfer ?? "Transferencia bancaria"}
                      subtitle={c.bankTransferHint ?? "Abono ahora · saldo en cuotas con nosotros"}
                    />
                  </div>
                  {paymentMethod === "card" && pricing?.clientChoosesGateway && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(pricing.cardProviders ?? ["sumup", "mercadopago"]).map((gw) => (
                        <OptionCard
                          key={gw}
                          selected={cardGateway === gw}
                          onClick={() => setCardGateway(gw)}
                          title={gw === "mercadopago" ? "Mercado Pago" : "SumUp"}
                          subtitle={
                            gw === "mercadopago"
                              ? "Cuotas y medios locales"
                              : "Tarjeta · cobro con boleta SumUp"
                          }
                        />
                      ))}
                    </div>
                  )}
                  {paymentMethod === "card" && pricing?.taxHint !== "afecto" && (
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                      Destinos internacionales se cobran solo con SumUp (exento de IVA).
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 px-1">
                  {discountAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>{c.subtotal ?? "Subtotal"}</span>
                        <span className="line-through tabular-nums">{formatCLP(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-emerald-700 font-medium">
                        <span>{c.discountLabel ?? "Descuento"}</span>
                        <span className="tabular-nums">-{formatCLP(discountAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-700 font-medium">
                        <span>{c.reservationTotal ?? "Total reserva"}</span>
                        <span className="tabular-nums">{formatCLP(cartTotalAfterDiscount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{c.totalToPay ?? "A pagar ahora"}</span>
                    <span className="text-2xl font-black text-black tabular-nums">{formatCLP(chargeAmount)}</span>
                  </div>
                </div>

                {paymentPlan === "deposito" && pricing?.canUseDeposit && (
                  <p className="text-xs text-teal-700 bg-teal/10 rounded-xl px-4 py-3 leading-relaxed">
                    {c.depositBalanceNote ?? "El saldo restante debe estar pagado 2 semanas antes del viaje."}
                    {" "}
                    ({formatCLP(cartTotalAfterDiscount - chargeAmount)} {c.remaining ?? "pendiente"})
                  </p>
                )}

                <CheckoutTrustBar minDepositPerPerson={pricing?.depositAmount} />
                <PaymentMethodBadges />

                <AvailabilityDisclaimer
                  variant="full"
                  withCheckbox
                  checked={availabilityAcknowledged}
                  onCheckedChange={setAvailabilityAcknowledged}
                />
              </div>
            )}
        </div>

        {items.length > 0 && (
          <div className="shrink-0 border-t border-slate-200 bg-white px-6 sm:px-8 py-4 space-y-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={gravitySpring}
              className="flex gap-3"
            >
              <Button onClick={handleConfirm} disabled={processing || loadingPricing}
                className="flex-1 bg-gradient-to-r from-amber to-orange-500 hover:from-amber-dark hover:to-orange-600 text-white font-bold rounded-xl h-12 gap-2 text-sm sm:text-base shadow-lg shadow-amber/25 transition-transform hover:scale-[1.01] active:scale-[0.99]">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {paymentMethod === "transferencia"
                  ? (c.confirmTransfer ?? "Confirmar reserva y ver datos")
                  : (c.payWithCard ?? "Pagar con tarjeta")}
              </Button>
              <a
                href={helpWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={c.needHelp ?? "¿Necesitas ayuda? Contacta a un agente"}
                className="inline-flex shrink-0 items-center justify-center rounded-xl h-12 w-12 border-2 border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </motion.div>
            <p className="text-center">
              <a
                href={helpWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#128C7E] hover:text-[#075E54] hover:underline leading-relaxed"
              >
                {c.needHelp ?? "¿Necesitas ayuda? Contacta a un agente"}
              </a>
            </p>
            <Button variant="outline" onClick={() => clearCart()} className="w-full rounded-xl h-11">
              {c.clear}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
