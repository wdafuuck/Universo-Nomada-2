"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, User, Phone, Clock, ShoppingBag, X, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RouletteWheel } from "@/components/RouletteWheel";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isRouletteDiscountPrize,
  isRouletteGiftPrize,
  ROULETTE_PURCHASE_HOURS,
  roulettePrizeHasBenefit,
  type RoulettePrizeId,
} from "@/lib/roulette-shared";
import {
  notifyRoulettePrizeUpdate,
  saveStoredRoulettePrize,
} from "@/lib/roulette-client";

type Phase = "register" | "spinning" | "result";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function RoulettePopup({ isOpen, onClose }: Props) {
  const { t } = useLanguage();
  const lp = t("leadPopup") as {
    title: string;
    subtitle: string;
    submit: string;
    rouletteTime: string;
    dismiss: string;
  };

  const [phase, setPhase] = useState<Phase>("register");
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [submitting, setSubmitting] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [prize, setPrize] = useState<RoulettePrizeId | null>(null);
  const [prizeLabel, setPrizeLabel] = useState("");
  const [formError, setFormError] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const endedRef = useRef(false);

  const timeHint =
    lp.rouletteTime?.replace("{hours}", String(ROULETTE_PURCHASE_HOURS)) ??
    `Tienes ${ROULETTE_PURCHASE_HOURS} horas para reservar y activar tu premio`;

  // Pausar animaciones pesadas del home mientras el popup está abierto
  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.classList.add("roulette-open");
    return () => document.documentElement.classList.remove("roulette-open");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setPhase("register");
    setSubmitting(false);
    setSpinning(false);
    setSegmentIndex(0);
    setPrize(null);
    setPrizeLabel("");
    setForm({ nombre: "", email: "", telefono: "" });
    setFormError("");
    setAlreadyRegistered(false);
    endedRef.current = false;
  }, [isOpen]);

  const persistPrize = (data: {
    spinId?: number;
    prize: RoulettePrizeId;
    prizeLabel?: string;
    expiresAt?: string;
    segmentIndex: number;
  }) => {
    try {
      saveStoredRoulettePrize(
        {
          spinId: data.spinId ?? 0,
          prize: data.prize,
          email: form.email.trim(),
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          expiresAt: data.expiresAt ?? new Date().toISOString(),
          segmentIndex: data.segmentIndex,
        },
        { silent: true },
      );
    } catch {
      // ignore
    }
  };

  const handleSpin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFormError("");
    setAlreadyRegistered(false);
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      setFormError("Completa todos los campos para unirte y girar");
      toast.error("Completa todos los campos para unirte y girar");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/roulette/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
        }),
      });

      const rawText = await res.text();
      let data: {
        error?: string;
        message?: string;
        alreadySpun?: boolean;
        alreadyRegistered?: boolean;
        segmentIndex?: number;
        prize?: RoulettePrizeId;
        prizeLabel?: string;
        spinId?: number;
        expiresAt?: string;
      } = {};
      try {
        data = rawText ? (JSON.parse(rawText) as typeof data) : {};
      } catch {
        data = {};
      }

      const registeredMsg = data.error || data.message || "Ya estás registrado";

      // Cualquier correo ya usado → mensaje claro (con o sin premio activo)
      if (
        res.status === 409 ||
        data.alreadyRegistered === true ||
        data.alreadySpun === true ||
        /ya est[aá]s registrado|ya participaste/i.test(`${data.error ?? ""} ${data.message ?? ""}`)
      ) {
        setFormError(registeredMsg);
        setAlreadyRegistered(true);
        toast.error(registeredMsg);

        if (data.prize && typeof data.segmentIndex === "number") {
          persistPrize({
            spinId: data.spinId,
            prize: data.prize,
            prizeLabel: data.prizeLabel,
            expiresAt: data.expiresAt,
            segmentIndex: data.segmentIndex,
          });
          setSegmentIndex(data.segmentIndex);
          setPrize(data.prize);
          setPrizeLabel(data.prizeLabel ?? "");
          endedRef.current = true;
          setSpinning(false);
          setPhase("result");
        }
        return;
      }

      if (!res.ok) {
        const msg = data.error || data.message || "No se pudo girar la ruleta";
        setFormError(msg);
        toast.error(msg);
        return;
      }
      if (typeof data.segmentIndex !== "number" || !data.prize) {
        setFormError("No se pudo leer el premio");
        toast.error("No se pudo leer el premio");
        return;
      }

      persistPrize({
        spinId: data.spinId,
        prize: data.prize,
        prizeLabel: data.prizeLabel,
        expiresAt: data.expiresAt,
        segmentIndex: data.segmentIndex,
      });

      endedRef.current = false;
      setSegmentIndex(data.segmentIndex);
      setPrize(data.prize);
      setPrizeLabel(data.prizeLabel ?? "");
      setPhase("spinning");
      setSpinning(true);
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpinEnd = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setSpinning(false);
    setPhase("result");
  };

  const handleClose = () => {
    if (phase === "spinning") return;
    try {
      notifyRoulettePrizeUpdate();
    } catch {
      // ignore
    }
    onClose();
  };

  if (!isOpen) return null;

  const hasBenefit = prize ? roulettePrizeHasBenefit(prize) : false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 overflow-y-auto"
      onClick={phase !== "spinning" ? handleClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg max-h-[100dvh] rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-y-auto bg-gradient-to-br from-teal via-teal to-amber-500 my-0 sm:my-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {phase !== "spinning" && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 z-20 h-11 w-11 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center ring-2 ring-white/40"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="px-5 pt-8 pb-8 sm:px-8">
          <div className="flex justify-center mb-4">
            <RouletteWheel
              segmentIndex={segmentIndex}
              spinning={spinning}
              onSpinEnd={handleSpinEnd}
              size={240}
            />
          </div>

          {phase === "register" && (
            <>
              <div className="flex items-start gap-2 mb-2 pr-10">
                <Heart className="h-6 w-6 text-pink-200 shrink-0 mt-0.5" />
                <h2 className="text-xl sm:text-2xl font-black leading-tight">{lp.title}</h2>
              </div>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">{lp.subtitle}</p>

              <form onSubmit={handleSpin} className="space-y-3" noValidate>
                {formError && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      alreadyRegistered
                        ? "bg-amber-100 text-amber-950"
                        : "bg-red-100 text-red-900"
                    }`}
                    role="alert"
                  >
                    {formError}
                  </div>
                )}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Tu nombre"
                    value={form.nombre}
                    onChange={(e) => {
                      setFormError("");
                      setForm({ ...form, nombre: e.target.value });
                    }}
                    className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => {
                      setFormError("");
                      setForm({ ...form, email: e.target.value });
                    }}
                    className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+56 9 ..."
                    value={form.telefono}
                    onChange={(e) => {
                      setFormError("");
                      setForm({ ...form, telefono: e.target.value });
                    }}
                    className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900"
                    required
                    autoComplete="tel"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0f172a] hover:bg-black text-white font-bold rounded-full h-12"
                >
                  {submitting ? "Preparando…" : lp.submit}
                </Button>
              </form>
              <p className="text-white/70 text-xs mt-3 text-center">{timeHint}</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 text-white/80 text-sm underline mx-auto block"
              >
                {lp.dismiss ?? "No gracias"}
              </button>
            </>
          )}

          {phase === "spinning" && (
            <div className="text-center pb-2">
              <h2 className="text-2xl font-black mb-1">¡Girando!</h2>
              <p className="text-white/90 text-sm">Tu premio está por salir...</p>
            </div>
          )}

          {phase === "result" && prize && (
            <div className="text-center">
              {alreadyRegistered && (
                <p className="text-amber-100 text-sm font-semibold mb-2">Ya estás registrado</p>
              )}
              {hasBenefit ? (
                <>
                  <p className="text-white/80 text-sm mb-1">¡Bienvenido a la familia Nómada!</p>
                  <p className="text-2xl font-black mb-4 leading-snug">{prizeLabel}</p>
                  <div className="flex items-center justify-center gap-2 text-amber-900 bg-white/95 rounded-xl px-4 py-3 text-sm font-semibold mb-4">
                    <Clock className="h-4 w-4 shrink-0" />
                    {timeHint}
                  </div>
                  {isRouletteDiscountPrize(prize) && (
                    <p className="text-white/80 text-xs mb-4">
                      El descuento se aplicará automáticamente en tu carrito.
                    </p>
                  )}
                  {prize === "tour_regalo" && (
                    <p className="text-white/80 text-xs mb-4">
                      Al armar tu paquete podrás elegir tu tour adicional de regalo.
                    </p>
                  )}
                  {isRouletteGiftPrize(prize) && prize !== "tour_regalo" && (
                    <p className="text-white/80 text-xs mb-4">
                      Te contactaremos para coordinar tu regalo al confirmar.
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={() => {
                      handleClose();
                      window.setTimeout(() => {
                        document.getElementById("destinos")?.scrollIntoView({ behavior: "smooth" });
                      }, 50);
                    }}
                    className="w-full bg-[#0f172a] hover:bg-black text-white font-bold rounded-full h-12"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Ir a reservar ahora
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold mb-2">Para la próxima tendrás más suerte</p>
                  <p className="text-white/80 text-sm mb-4">¡Gracias por unirte a la familia Nómada!</p>
                  <Button
                    type="button"
                    onClick={handleClose}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-bold rounded-full h-11 border border-white/30"
                  >
                    Seguir explorando
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
