"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, Gift, ShoppingBag } from "lucide-react";
import {
  isRouletteDiscountPrize,
  isRouletteGiftPrize,
  ROULETTE_PURCHASE_HOURS,
  roulettePrizeHasBenefit,
  roulettePrizeLabel,
  type RoulettePrizeId,
} from "@/lib/roulette-shared";
import { notifyRoulettePrizeUpdate } from "@/lib/roulette-client";

type Result = {
  prize: RoulettePrizeId;
  prizeLabel: string;
  expiresAt?: string;
};

export default function RuletaPremioClient() {
  const params = useSearchParams();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = sessionStorage.getItem("un_roulette_result");
        if (raw) {
          const parsed = JSON.parse(raw) as Result;
          if (parsed?.prize && !cancelled) {
            setResult({
              prize: parsed.prize,
              prizeLabel: parsed.prizeLabel || roulettePrizeLabel(parsed.prize),
              expiresAt: parsed.expiresAt,
            });
            try {
              notifyRoulettePrizeUpdate();
            } catch {
              // ignore
            }
            return;
          }
        }
      } catch {
        // API fallback
      }

      const spinId = params.get("spinId");
      const email = params.get("email");
      if (!spinId || !email) {
        if (!cancelled) setError("No encontramos tu premio. Vuelve a intentarlo.");
        return;
      }

      try {
        const res = await fetch(
          `/api/roulette/status?spinId=${encodeURIComponent(spinId)}&email=${encodeURIComponent(email)}`,
        );
        const data = await res.json();
        if (!res.ok || !data.prize) {
          if (!cancelled) setError(data.error ?? "No se pudo cargar el premio");
          return;
        }
        if (!cancelled) {
          setResult({
            prize: data.prize,
            prizeLabel: data.prizeLabel ?? roulettePrizeLabel(data.prize),
            expiresAt: data.expiresAt,
          });
          try {
            notifyRoulettePrizeUpdate();
          } catch {
            // ignore
          }
        }
      } catch {
        if (!cancelled) setError("Error de conexión");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  const timeHint = `Tienes ${ROULETTE_PURCHASE_HOURS} horas para reservar y activar tu premio`;

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-[#0D1B2A] via-teal to-amber-600 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <a href="/" className="text-white/80 text-sm underline underline-offset-2">
          ← Volver al inicio
        </a>

        <div className="mt-8 rounded-3xl bg-black/25 p-6 shadow-xl text-center">
          {!result && !error && (
            <p className="text-white/90 py-10">Cargando tu premio…</p>
          )}

          {error && (
            <>
              <p className="text-white font-semibold mb-4">{error}</p>
              <a
                href="/ruleta"
                className="inline-flex items-center justify-center rounded-full bg-[#0f172a] text-white font-bold h-11 px-6"
              >
                Intentar de nuevo
              </a>
            </>
          )}

          {result && (
            <>
              <Gift className="h-12 w-12 mx-auto mb-3" aria-hidden />
              {roulettePrizeHasBenefit(result.prize) ? (
                <>
                  <p className="text-white/80 text-sm mb-1">¡Bienvenido a la familia Nómada!</p>
                  <p className="text-2xl font-black mb-4 leading-snug">{result.prizeLabel}</p>
                  <div className="flex items-center justify-center gap-2 text-amber-900 bg-white/95 rounded-xl px-4 py-3 text-sm font-semibold mb-4">
                    <Clock className="h-4 w-4 shrink-0" />
                    {timeHint}
                  </div>
                  {isRouletteDiscountPrize(result.prize) && (
                    <p className="text-white/80 text-xs mb-4">
                      El descuento se aplicará automáticamente en tu carrito.
                    </p>
                  )}
                  {result.prize === "tour_regalo" && (
                    <p className="text-white/80 text-xs mb-4">
                      Al armar tu paquete podrás elegir tu tour adicional de regalo.
                    </p>
                  )}
                  {isRouletteGiftPrize(result.prize) && result.prize !== "tour_regalo" && (
                    <p className="text-white/80 text-xs mb-4">
                      Te contactaremos para coordinar tu regalo al confirmar.
                    </p>
                  )}
                  <a
                    href="/#destinos"
                    className="inline-flex w-full items-center justify-center gap-2 bg-[#0f172a] hover:bg-black text-white font-bold rounded-full h-12"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Ir a reservar ahora
                  </a>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold mb-2">Para la próxima tendrás más suerte</p>
                  <p className="text-white/80 text-sm mb-4">¡Gracias por unirte a la familia Nómada!</p>
                  <a
                    href="/"
                    className="inline-flex w-full items-center justify-center bg-white/20 hover:bg-white/30 text-white font-bold rounded-full h-11 border border-white/30"
                  >
                    Seguir explorando
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
