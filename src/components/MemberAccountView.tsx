"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar, MapPin, Lock, Gift, Stamp, LogOut, Plane, ChevronRight, Copy, CheckCircle2, FileText, ExternalLink,
  AlertCircle, CalendarClock, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MemberAuthPanel } from "@/components/MemberAuthPanel";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import type { MemberTrip } from "@/lib/member-trips";
import { buildTransferProofMailto, buildTransferProofWhatsApp } from "@/lib/bank-transfer";
import type { EarnedBadge, PassportBadgeDef } from "@/lib/passport-badges";
import { FlowField } from "@/components/motion/FlowField";
import { gravitySpring } from "@/lib/motion-presets";

type Benefit = {
  id: number;
  brandName: string;
  title: string;
  description: string;
  instructions: string;
  image: string;
  couponCode: string;
  discountLabel: string;
  restrictionType: string;
  restrictionNote: string;
  available: boolean;
  lockReason: string | null;
};

type TripDocument = {
  id: number;
  label: string;
  fileUrl: string;
  fileName: string;
};

type User = { id: string; email: string; name: string | null; role: string };

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

function TripDocuments({ leadId }: { leadId: string | number }) {
  const id = typeof leadId === "string" ? leadId : String(leadId);
  const [docs, setDocs] = useState<TripDocument[]>([]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch(`/api/me/trips/${id}/documents`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { documents: [], available: false }))
      .then((d) => {
        setDocs(d.documents ?? []);
        setDaysRemaining(typeof d.daysRemaining === "number" ? d.daysRemaining : null);
      })
      .finally(() => setLoaded(true));
  }, [id]);

  if (!loaded || docs.length === 0) return null;

  return (
    <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 space-y-2">
      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <FileText className="h-4 w-4 text-teal" /> Documentos de tu viaje
      </p>
      {daysRemaining != null && daysRemaining > 0 && (
        <p className="text-xs text-slate-500">
          Disponibles para descarga por {daysRemaining} día{daysRemaining !== 1 ? "s" : ""} más
          (se eliminan 3 meses después de finalizar el viaje).
        </p>
      )}
      <ul className="space-y-2">
        {docs.map((doc) => (
          <li key={doc.id}>
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 hover:text-teal border border-slate-100"
            >
              <span className="font-medium truncate">{doc.label}</span>
              <ExternalLink className="h-4 w-4 shrink-0 text-teal" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TripCard({ trip, variant }: { trip: MemberTrip; variant: "upcoming" | "past" }) {
  const showTransferAlert = variant === "upcoming"
    && trip.status === "pendiente_transferencia"
    && trip.paymentMethod === "transferencia";
  const showBalanceAlert = variant === "upcoming"
    && trip.balanceDue > 0
    && trip.status !== "pendiente_transferencia";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal">Reserva #{trip.leadId}</p>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            {trip.destino ?? trip.items.map((i) => i.tourName).join(", ")}
          </h3>
          <p className="text-sm text-slate-500 mt-1 capitalize">Estado: {trip.status.replace(/_/g, " ")}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
          variant === "upcoming" ? "bg-teal/10 text-teal" : "bg-slate-100 text-slate-600"
        }`}>
          {variant === "upcoming" ? "Programado" : "Realizado"}
        </span>
      </div>

      {showBalanceAlert && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
          <div className="flex gap-3">
            <CalendarClock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">
                Saldo pendiente: {formatCLP(trip.balanceDue)}
              </p>
              {trip.balancePaymentDeadlineLabel && (
                <p className="text-sm text-amber-800 mt-1">
                  Fecha máxima de pago: <strong>{trip.balancePaymentDeadlineLabel}</strong>
                  {trip.daysUntilBalanceDeadline != null && trip.daysUntilBalanceDeadline >= 0 && (
                    <span className="block mt-0.5">
                      {trip.daysUntilBalanceDeadline === 0
                        ? "Vence hoy"
                        : `Faltan ${trip.daysUntilBalanceDeadline} día${trip.daysUntilBalanceDeadline !== 1 ? "s" : ""}`}
                    </span>
                  )}
                  {trip.daysUntilBalanceDeadline != null && trip.daysUntilBalanceDeadline < 0 && (
                    <span className="block mt-0.5 text-red-700 font-semibold">Plazo vencido — contáctanos para regularizar</span>
                  )}
                </p>
              )}
              <p className="text-xs text-amber-700 mt-2">
                Pagado hasta ahora: {formatCLP(trip.amountPaid)} de {formatCLP(trip.cartTotal)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={buildTransferProofWhatsApp(trip.balanceDue, String(trip.leadId))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white hover:bg-[#20bd5a]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Enviar comprobante por WhatsApp
            </a>
            <a
              href={buildTransferProofMailto(trip.balanceDue, String(trip.leadId))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50"
            >
              Enviar comprobante por email
            </a>
          </div>
        </div>
      )}

      {showTransferAlert && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 space-y-3">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-orange-700 shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900">
              <p className="font-bold">
                Transferencia pendiente: {formatCLP(trip.amountPaid)}
              </p>
              {trip.expiresAt && (
                <p className="mt-1">
                  Plazo para enviar comprobante: {new Date(trip.expiresAt).toLocaleString("es-CL", {
                    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              )}
              {trip.balanceDue > 0 && (
                <p className="mt-2 text-orange-800">
                  Tras confirmar este abono, el saldo restante será {formatCLP(trip.balanceDue)}
                  {trip.balancePaymentDeadlineLabel && (
                    <> (fecha límite: {trip.balancePaymentDeadlineLabel})</>
                  )}.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={buildTransferProofWhatsApp(trip.amountPaid, String(trip.leadId))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white hover:bg-[#20bd5a]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Enviar comprobante por WhatsApp
            </a>
            <a
              href={buildTransferProofMailto(trip.amountPaid, String(trip.leadId))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-900 hover:bg-orange-50"
            >
              Enviar comprobante por email
            </a>
          </div>
        </div>
      )}

      {trip.isFullyPaid && variant === "upcoming" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Reserva pagada al 100%
        </div>
      )}

      {trip.items.map((item, idx) => (
        <div key={idx} className="rounded-xl bg-slate-50 p-4 space-y-2">
          <p className="font-semibold text-slate-900">{item.tourName}</p>
          {item.checkIn && item.checkOut && (
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal" />
              {item.checkIn} → {item.checkOut}
            </p>
          )}
          {item.accommodationName && (
            <p className="text-sm text-slate-600">{item.accommodationName} · {item.roomLabel}</p>
          )}
          <p className="text-sm text-slate-500">{item.passengers} viajero(s)</p>
          <p className="text-sm font-bold text-slate-900">{formatCLP(item.totalPrice)}</p>
        </div>
      ))}

      <div className="flex flex-wrap gap-3 text-sm border-t border-slate-100 pt-4">
        <span>Total reserva: <strong>{formatCLP(trip.cartTotal)}</strong></span>
        {trip.balanceDue > 0 && (
          <span className="text-amber-700">Saldo pendiente: <strong>{formatCLP(trip.balanceDue)}</strong></span>
        )}
      </div>

      <TripDocuments leadId={trip.leadId} />

      <Link
        href={`/reserva/confirmacion?reserva=${trip.leadId}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline"
      >
        Ver confirmación completa <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function BenefitTile({ benefit, onOpen }: { benefit: Benefit; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`rounded-2xl border overflow-hidden shadow-sm text-left transition-all hover:shadow-md w-full ${
        benefit.available
          ? "border-slate-200 bg-white hover:border-teal/40"
          : "border-slate-200 bg-slate-50 opacity-75"
      }`}
    >
      {benefit.image ? (
        <div className="relative h-32 w-full bg-slate-100">
          <UploadAwareImage src={benefit.image} alt={benefit.title} fill className="object-cover" />
          {!benefit.available && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-r from-teal/20 to-amber/20 flex items-center justify-center">
          <Gift className="h-10 w-10 text-teal" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-2">{benefit.title}</h3>
        {benefit.available && benefit.discountLabel ? (
          <span className="inline-block mt-2 rounded-full bg-amber/15 text-amber-800 text-xs font-bold px-2 py-0.5">
            {benefit.discountLabel}
          </span>
        ) : !benefit.available ? (
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Lock className="h-3 w-3 shrink-0" />
            Se desbloquea con una reserva activa
          </p>
        ) : null}
      </div>
    </button>
  );
}

function BenefitDetailDialog({
  benefit,
  open,
  onClose,
}: {
  benefit: Benefit | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!benefit) return null;

  const copyCode = () => {
    if (!benefit.couponCode || !benefit.available) return;
    void navigator.clipboard.writeText(benefit.couponCode);
    toast.success("Código copiado");
  };

  const instructions = benefit.instructions?.trim() || benefit.description;
  const lockMessage = benefit.lockReason || "Se desbloquea con una reserva activa.";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {benefit.available && benefit.image ? (
            <div className="relative h-40 w-full rounded-xl overflow-hidden mb-2 -mx-1">
              <UploadAwareImage src={benefit.image} alt={benefit.title} fill className="object-cover" />
            </div>
          ) : null}
          {benefit.available ? (
            <p className="text-xs font-bold uppercase text-teal">{benefit.brandName}</p>
          ) : null}
          <DialogTitle className="text-xl">{benefit.title}</DialogTitle>
          {benefit.available && benefit.discountLabel ? (
            <span className="inline-block w-fit rounded-full bg-amber/15 text-amber-800 text-xs font-bold px-3 py-1">
              {benefit.discountLabel}
            </span>
          ) : null}
        </DialogHeader>

        {!benefit.available ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-2">
            <Lock className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{lockMessage}</p>
          </div>
        ) : (
          <>
            {benefit.lockReason ? (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{benefit.lockReason}</p>
            ) : null}

            <div className="space-y-3 text-sm text-slate-600">
              <h4 className="font-bold text-slate-900">Cómo utilizar este beneficio</h4>
              <div className="whitespace-pre-wrap leading-relaxed">{instructions}</div>
            </div>

            {benefit.couponCode ? (
              <button
                type="button"
                onClick={copyCode}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-teal/40 bg-teal/5 px-4 py-3 text-sm font-mono font-bold text-teal"
              >
                {benefit.couponCode}
                <Copy className="h-4 w-4" />
              </button>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BadgeTile({
  badge,
  earned,
}: {
  badge: EarnedBadge | PassportBadgeDef;
  earned: boolean;
}) {
  return (
    <motion.div
      whileHover={earned ? { y: -4, scale: 1.02 } : undefined}
      transition={gravitySpring}
      className={`rounded-2xl border p-5 text-center transition-colors ${
      earned
        ? "border-teal/30 bg-gradient-to-b from-teal/10 to-white shadow-sm hover:shadow-md hover:border-teal/50"
        : "border-slate-200 bg-slate-50 opacity-60 grayscale"
    }`}>
      <div
        className={`mx-auto mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-transparent ${
          earned ? "drop-shadow-md" : ""
        }`}
      >
        {badge.image ? (
          <img
            src={badge.image}
            alt={badge.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-white shadow-md">
            <Stamp className="h-10 w-10 text-slate-300" />
          </div>
        )}
      </div>
      <p className="font-bold text-slate-900">{badge.name}</p>
      {badge.description ? (
        <p className="text-xs text-slate-500 mt-1.5 leading-snug">{badge.description}</p>
      ) : null}
      {earned && "earnedAt" in badge && (
        <p className="text-[10px] text-teal font-semibold mt-2 flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Conseguida
        </p>
      )}
      {!earned && (
        <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> Por descubrir
        </p>
      )}
    </motion.div>
  );
}

export function MemberAccountView() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<MemberTrip[]>([]);
  const [past, setPast] = useState<MemberTrip[]>([]);
  const [benefitsEligible, setBenefitsEligible] = useState(false);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [lockedBadges, setLockedBadges] = useState<PassportBadgeDef[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const tripsRes = await fetch("/api/me/trips", { credentials: "include" });
      if (!tripsRes.ok) {
        setUser(null);
        setLoading(false);
        return;
      }
      const tripsData = await tripsRes.json();
      setUser(tripsData.user);
      setUpcoming(tripsData.upcoming ?? []);
      setPast(tripsData.past ?? []);
      setBenefitsEligible(Boolean(tripsData.benefitsEligible));

      const [benefitsRes, passportRes] = await Promise.all([
        fetch("/api/me/benefits", { credentials: "include" }),
        fetch("/api/me/passport", { credentials: "include" }),
      ]);

      if (benefitsRes.ok) {
        const benefitsData = await benefitsRes.json();
        setBenefits(benefitsData.benefits ?? []);
        setBenefitsEligible(Boolean(benefitsData.eligible));
      }

      if (passportRes.ok) {
        const passportData = await passportRes.json();
        setEarnedBadges(passportData.earned ?? []);
        setLockedBadges(passportData.locked ?? []);
      }
    } catch {
      toast.error("Error cargando tu cuenta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setUpcoming([]);
    setPast([]);
    setBenefits([]);
    setEarnedBadges([]);
    setLockedBadges([]);
    toast.success("Sesión cerrada");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Cargando tu cuenta...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy to-slate-900 py-10 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center text-white space-y-3">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-teal/20 flex items-center justify-center">
              <Plane className="h-7 w-7 text-teal" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Mi cuenta Nómada</h1>
            <p className="text-white/70 text-sm">
              Regístrate o inicia sesión para ver tus viajes, beneficios y pasaporte nómada.
            </p>
            <p className="text-white/45 text-xs max-w-sm mx-auto">
              Es tu cuenta de viajero. El panel de administración usa usuario y contraseña desde el footer del sitio.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <MemberAuthPanel
              onSuccess={(u) => {
                setUser({ ...u, role: "user" });
                void loadData();
              }}
            />
          </div>

          <Link href="/" className="block text-center text-sm text-white/50 hover:text-white/80">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-teal text-sm font-semibold">Mi cuenta</p>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Hola{user.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-white/60 text-sm mt-1">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                Inicio
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => void handleLogout()}
              className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="trips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-white border border-slate-200 rounded-2xl">
            <TabsTrigger value="trips" className="rounded-xl py-3 data-[state=active]:bg-teal data-[state=active]:text-navy font-semibold">
              <MapPin className="h-4 w-4 mr-2 hidden sm:inline" /> Mis viajes
            </TabsTrigger>
            <TabsTrigger value="benefits" className="rounded-xl py-3 data-[state=active]:bg-teal data-[state=active]:text-navy font-semibold">
              <Gift className="h-4 w-4 mr-2 hidden sm:inline" /> Beneficios
            </TabsTrigger>
            <TabsTrigger value="passport" className="rounded-xl py-3 data-[state=active]:bg-teal data-[state=active]:text-navy font-semibold">
              <Stamp className="h-4 w-4 mr-2 hidden sm:inline" /> Pasaporte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trips" className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal" /> Viajes programados
              </h2>
              {upcoming.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                  No tienes viajes programados. <Link href="/" className="text-teal font-semibold hover:underline">Explora destinos</Link>
                </div>
              ) : (
                <div className="grid gap-4">{upcoming.map((trip) => <TripCard key={trip.leadId} trip={trip} variant="upcoming" />)}</div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Viajes pasados</h2>
              {past.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                  Aún no hay viajes completados registrados a tu nombre.
                </div>
              ) : (
                <div className="grid gap-4">{past.map((trip) => <TripCard key={trip.leadId} trip={trip} variant="past" />)}</div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="benefits">
            {benefits.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                {benefitsEligible
                  ? "Pronto agregaremos cupones y descuentos exclusivos para ti."
                  : "Los beneficios se desbloquean con una reserva activa."}
              </div>
            ) : (
              <>
                {!benefitsEligible && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-4 text-sm text-amber-900 flex gap-2">
                    <Lock className="h-5 w-5 shrink-0" />
                    <p>
                      Podés ver los títulos de los beneficios. El detalle y el código se desbloquean con una
                      reserva activa.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {benefits.map((b) => (
                    <BenefitTile
                      key={b.id}
                      benefit={b}
                      onOpen={() => {
                        setSelectedBenefit(b);
                        setBenefitDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
                <BenefitDetailDialog
                  benefit={selectedBenefit}
                  open={benefitDialogOpen}
                  onClose={() => setBenefitDialogOpen(false)}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="passport">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-slate-900 to-teal/80 text-white p-6 mb-6 border border-white/10 shadow-xl">
              <FlowField variant="aurora" className="opacity-25" intensity="subtle" />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">Mi pasaporte nómada</h2>
                    <p className="text-white/80 text-sm mt-2 max-w-md">
                      Cada destino que exploras con nosotros se convierte en una insignia en tu pasaporte.
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="shrink-0 h-14 w-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20"
                  >
                    <Stamp className="h-7 w-7 text-teal-300" />
                  </motion.div>
                </div>
                <p className="mt-6 text-4xl font-black tabular-nums">{earnedBadges.length} / {earnedBadges.length + lockedBadges.length}</p>
                <p className="text-white/70 text-sm">insignias conseguidas</p>
                {earnedBadges.length + lockedBadges.length > 0 && (
                  <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(earnedBadges.length / (earnedBadges.length + lockedBadges.length)) * 100}%` }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-teal to-amber"
                    />
                  </div>
                )}
              </div>
            </div>

            {earnedBadges.length > 0 && (
              <section className="mb-8">
                <h3 className="font-bold text-slate-900 mb-4">Conseguidas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {earnedBadges.map((b, i) => (
                    <motion.div
                      key={`${b.slug}-${b.tripId}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, ...gravitySpring }}
                    >
                      <BadgeTile badge={b} earned />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {lockedBadges.length > 0 && (
              <section>
                <h3 className="font-bold text-slate-900 mb-4">Por descubrir</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {lockedBadges.map((b, i) => (
                    <motion.div
                      key={b.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, ...gravitySpring }}
                    >
                      <BadgeTile badge={b} earned={false} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
