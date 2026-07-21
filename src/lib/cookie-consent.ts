export type CookieConsentLevel = "essential" | "all";

const STORAGE_KEY = "un_cookie_consent";

export function getCookieConsent(): CookieConsentLevel | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "all" || v === "essential" ? v : null;
}

export function setCookieConsent(level: CookieConsentLevel): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, level);
  window.dispatchEvent(new CustomEvent("un-cookie-consent", { detail: level }));
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === "all";
}
