import type { RoulettePrizeId } from "@/lib/roulette-shared";

export const ROULETTE_STORAGE_KEY = "un_roulette_prize";
export const ROULETTE_DISMISSED_KEY = "un_roulette_dismissed";

export type StoredRoulettePrize = {
  spinId: number;
  prize: RoulettePrizeId;
  email: string;
  nombre: string;
  telefono: string;
  expiresAt: string;
  segmentIndex: number;
};

export function getStoredRoulettePrize(): StoredRoulettePrize | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ROULETTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRoulettePrize;
    if (!parsed.spinId || !parsed.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(ROULETTE_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredRoulettePrize(
  data: StoredRoulettePrize,
  opts?: { silent?: boolean },
): void {
  localStorage.setItem(ROULETTE_STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(ROULETTE_DISMISSED_KEY, "1");
  if (!opts?.silent && typeof window !== "undefined") {
    window.dispatchEvent(new Event("un-roulette-update"));
  }
}

export function notifyRoulettePrizeUpdate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("un-roulette-update"));
  }
}

export function subscribeRoulettePrize(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener("un-roulette-update", handler);
  // Countdown cada 5s (antes 1s) — menos trabajo en el hilo principal
  const id = window.setInterval(handler, 5000);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("un-roulette-update", handler);
    window.clearInterval(id);
  };
}

export function clearStoredRoulettePrize(): void {
  localStorage.removeItem(ROULETTE_STORAGE_KEY);
}

export function rouletteMsRemaining(expiresAt: string): number {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

export function formatRouletteCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (hours > 0) {
    return `${hours}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
