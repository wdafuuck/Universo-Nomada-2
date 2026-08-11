/** Noscript GTM — solo si hay consentimiento analytics (misma regla que ConditionalAnalytics). */
export function GtmNoscript() {
  // Sin JS no hay forma fiable de leer consentimiento; omitimos iframe
  // para no cargar terceros en el lab de PageSpeed / usuarios sin consent.
  return null;
}
