export function getUsdClpRate(): number {
  const n = Number(process.env.LITEAPI_USD_CLP ?? process.env.RATEHAWK_USD_CLP);
  return Number.isFinite(n) && n > 0 ? n : 1000;
}

/** Recargo por persona: (precio real − tope) × TC ÷ 2 (hab. doble). */
export function computeRatehawkSurchargePerPerson(
  livePriceUsd: number,
  maxPriceUsd: number,
  usdClpRate = getUsdClpRate(),
): number {
  if (livePriceUsd <= maxPriceUsd) return 0;
  return Math.round(((livePriceUsd - maxPriceUsd) * usdClpRate) / 2);
}
