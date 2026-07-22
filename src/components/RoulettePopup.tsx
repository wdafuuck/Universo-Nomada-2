"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, User, Phone, Clock, ShoppingBag, X, Heart, Gift } from "lucide-react";
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

type SpinResult = {
  segmentIndex: number;
  prize: RoulettePrizeId;
  prizeLabel: string;
  spinId: number;
  expiresAt: string;
};

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
  const pendingSaveRef = useRef<SpinResult | null>(null);
  const endedRef = useRef(false);

  const timeHint =
    lp.rouletteTime?.replace("{hours}", String(ROULETTE_PURCHASE_HOURS)) ??
    `Tienes ${ROULETTE_PURCHASE_HOURS} horas para reservar y activar tu premio`;

  useEffect(() => {
    if (!isOpen) return;
    setPhase("register");
    setSubmitting(false);
    setSpinning(false);
    setSegmentIndex(0);
    setPrize(null);
    setPrizeLabel("");
    setForm({ nombre: "", email: "", telefono: "" });
    pendingSaveRef.current = null;
    endedRef.current = false;
  }, [isOpen]);

  const persistPrize = (pending: SpinResult) => {
    try {
      saveStoredRoulettePrize(
        {
          spinId: pending.spinId,
          prize: pending.prize,
          email: form.email.trim(),
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          expiresAt: pending.expiresAt,
          segmentIndex: pending.segmentIndex,
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
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      toast.error("Completa todos los campos para unirte y girar");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/roulette/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
        }),
      });
      let data: {
        error?: string;
        segmentIndex?: number;
        prize?: RoulettePrizeId;
        prizeLabel?: string;
        spinId?: number;
        expiresAt?: string;
      } = {};
      try {
        data = await res.json();
      } catch {
        toast.error("Respuesta inválida del servidor. Recarga e intenta de nuevo.");
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo girar la ruleta");
        return;
      }
      if (typeof data.segmentIndex !== "number" || !data.prize) {
        toast.error("No se pudo leer el premio. Intenta de nuevo.");
        return;
      }

      const pending: SpinResult = {
        segmentIndex: data.segmentIndex,
        prize: data.prize,
        prizeLabel: data.prizeLabel ?? "",
        spinId: data.spinId ?? 0,
        expiresAt: data.expiresAt ?? new Date().toISOString(),
      };
      pendingSaveRef.current = pending;
      // Guardar ya (sin notificar barra) por si el tab se cierra
      persistPrize(pending);

      setSegmentIndex(pending.segmentIndex);
      setPrize(pending.prize);
      setPrizeLabel(pending.prizeLabel);
      endedRef.current = false;
      setPhase("spinning");
      setSpinning(true);
    } catch {
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
  const showWheel = phase === "register" || phase === "spinning";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 overflow-y-auto overscroll-contain"
      onClick={phase !== "spinning" ? handleClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg max-h-[100dvh] sm:max-h-[min(92dvh,800px)] rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-y-auto bg-gradient-to-br from-teal via-teal to-amber-500 my-0 sm:my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {phase !== "spinning" && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 z-20 h-11 w-11 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center shadow-lg ring-2 ring-white/40"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="px-5 pt-6 pb-8 sm:px-8 text-white">
          {showWheel && (
            <div className="flex justify-center mb-4 sm:mb-6">
              <RouletteWheel
                segmentIndex={segmentIndex}
                spinning={spinning}
                onSpinEnd={handleSpinEnd}
                size={210}
                idle={phase === "register"}
                active={showWheel}
              />
            </div>
          )}

          {phase === "register" && (
            <>
              <div className="flex items-start gap-2 mb-2 pr-10">
                <Heart className="h-6 w-6 text-pink-200 shrink-0 mt-0.5" />
                <h2 className="text-xl sm:text-2xl font-black leading-tight">{lp.title}</h2>
              </div>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">{lp.subtitle}</p>

              <form onSubmit={handleSpin} className="space-y-3" noValidate>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Tu nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900 shadow-md"
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
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900 shadow-md"
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
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900 shadow-md"
                    required
                    autoComplete="tel"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0f172a] hover:bg-black text-white font-bold rounded-full h-12 text-base shadow-lg mt-2"
                >
                  {submitting ? "Girando..." : lp.submit}
                </Button>
              </form>

              <p className="text-white/70 text-xs mt-3 text-center">{timeHint}</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 text-white/80 hover:text-white text-sm font-medium underline underline-offset-2 mx-auto block pb-[env(safe-area-inset-bottom)]"
              >
                {lp.dismiss ?? "No gracias"}
              </button>
            </>
          )}

          {phase === "spinning" && (
            <div className="text-center pb-4">
              <h2 className="text-2xl font-black mb-2">¡Girando!</h2>
              <p className="text-white/90">Tu premio está por salir...</p>
            </div>
          )}

          {phase === "result" && prize && (
            <div className="text-center pt-2">
              <Gift className="h-12 w-12 mx-auto mb-3 text-white" aria-hidden />
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
                    onClick={() => {
                      handleClose();
                      window.setTimeout(() => {
                        document.getElementById("destinos")?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
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
