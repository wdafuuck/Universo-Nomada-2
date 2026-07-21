"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { saveStoredRoulettePrize } from "@/lib/roulette-client";
import { trackGenerateLead } from "@/lib/analytics-events";

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

  const timeHint = lp.rouletteTime?.replace("{hours}", String(ROULETTE_PURCHASE_HOURS))
    ?? `Tienes ${ROULETTE_PURCHASE_HOURS} horas para reservar y activar tu premio`;

  useEffect(() => {
    if (!isOpen) return;
    setPhase("register");
    setSubmitting(false);
    setSpinning(false);
    setSegmentIndex(0);
    setPrize(null);
    setPrizeLabel("");
    setForm({ nombre: "", email: "", telefono: "" });
  }, [isOpen]);

  const handleSpin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      toast.error("Completa todos los campos para unirte y girar");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/roulette/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo girar la ruleta");
        return;
      }

      setSegmentIndex(data.segmentIndex);
      setPrize(data.prize);
      setPrizeLabel(data.prizeLabel);
      setPhase("spinning");
      setSpinning(true);

      trackGenerateLead({ source: "ruleta-familia" });

      saveStoredRoulettePrize({
        spinId: data.spinId,
        prize: data.prize,
        email: form.email.trim(),
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        expiresAt: data.expiresAt,
        segmentIndex: data.segmentIndex,
      });
    } catch {
      toast.error("Error de conexi?n. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpinEnd = () => {
    setSpinning(false);
    setPhase("result");
  };

  const handleClose = () => {
    if (phase === "spinning") return;
    onClose();
  };

  const hasBenefit = prize ? roulettePrizeHasBenefit(prize) : false;
  const wheelDisplay = phase === "register" ? "half" : "full";
  const wheelSize = phase === "register" ? 220 : 260;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm overflow-y-auto overscroll-contain"
          onClick={phase !== "spinning" ? handleClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[100dvh] sm:max-h-[min(92dvh,900px)] rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-y-auto bg-gradient-to-br from-teal via-teal to-amber-500 my-0 sm:my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {phase !== "spinning" && (
              <button
                type="button"
                onClick={handleClose}
                className="sticky top-3 float-right mr-3 mb-[-2.5rem] z-20 h-11 w-11 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center shadow-lg ring-2 ring-white/40"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <div className="flex flex-col md:flex-row md:items-stretch clear-both">
              <div className="order-2 md:order-1 flex items-center justify-center md:justify-end px-2 py-3 sm:py-6 md:py-10 md:w-[46%] md:min-h-[360px] bg-black/10 overflow-hidden shrink-0">
                <RouletteWheel
                  segmentIndex={segmentIndex}
                  spinning={spinning}
                  onSpinEnd={handleSpinEnd}
                  size={wheelSize}
                  pointer="right"
                  idle={phase === "register"}
                  display={wheelDisplay}
                />
              </div>

              <div className="order-1 md:order-2 flex flex-col justify-center px-5 pt-4 pb-6 sm:px-6 sm:py-8 md:w-[54%] md:px-8 text-white">
                {phase === "register" && (
                  <>
                    <div className="flex items-start gap-2 mb-2 pr-10">
                      <Heart className="h-6 w-6 text-pink-200 shrink-0 mt-0.5" />
                      <h2 className="text-xl sm:text-3xl font-black leading-tight">
                        {lp.title}
                      </h2>
                    </div>
                    <p className="text-white/90 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                      {lp.subtitle}
                    </p>

                    <form onSubmit={handleSpin} className="space-y-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Tu nombre"
                          value={form.nombre}
                          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                          className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900 shadow-md"
                          required
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
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-[#0f172a] hover:bg-black text-white font-bold rounded-full h-12 text-base shadow-lg mt-2 sticky bottom-2 z-10"
                      >
                        {submitting ? "Girando..." : lp.submit}
                      </Button>
                    </form>

                    <p className="text-white/70 text-xs mt-3 sm:mt-4 text-center">{timeHint}</p>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-3 sm:mt-4 mb-1 text-white/80 hover:text-white text-sm font-medium underline underline-offset-2 mx-auto block pb-[env(safe-area-inset-bottom)]"
                    >
                      {lp.dismiss ?? "No gracias"}
                    </button>
                  </>
                )}

                {(phase === "spinning" || phase === "result") && (
                  <div className="text-center md:text-left">
                    {phase === "spinning" && (
                      <>
                        <h2 className="text-2xl font-black mb-2">?Girando!</h2>
                        <p className="text-white/90">Tu premio est? por salir...</p>
                      </>
                    )}

                    {phase === "result" && prize && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {hasBenefit ? (
                          <>
                            <p className="text-white/80 text-sm mb-1">?Bienvenido a la familia N?mada!</p>
                            <p className="text-2xl font-black mb-4 leading-snug">{prizeLabel}</p>
                            <div className="flex items-center gap-2 text-amber-900 bg-white/95 rounded-xl px-4 py-3 text-sm font-semibold mb-4">
                              <Clock className="h-4 w-4 shrink-0" />
                              {timeHint}
                            </div>
                            {isRouletteDiscountPrize(prize) && (
                              <p className="text-white/80 text-xs mb-4">
                                El descuento se aplicar? autom?ticamente en tu carrito.
                              </p>
                            )}
                            {prize === "tour_regalo" && (
                              <p className="text-white/80 text-xs mb-4">
                                Al armar tu paquete podr?s elegir tu tour adicional de regalo.
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
                                document.getElementById("destinos")?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="w-full bg-[#0f172a] hover:bg-black text-white font-bold rounded-full h-12"
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Ir a reservar ahora
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="text-xl font-bold mb-2">Para la pr?xima tendr? m?s suerte</p>
                            <p className="text-white/80 text-sm mb-4">?Gracias por unirte a la familia N?mada!</p>
                            <Button
                              onClick={handleClose}
                              className="w-full bg-white/20 hover:bg-white/30 text-white font-bold rounded-full h-11 border border-white/30"
                            >
                              Seguir explorando
                            </Button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
