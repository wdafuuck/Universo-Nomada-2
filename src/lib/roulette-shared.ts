import type { DiscountType } from "@/lib/discount-codes";

/** Constantes y helpers de ruleta seguros para cliente (sin Prisma / Node). */

export const ROULETTE_PURCHASE_HOURS = 6;

/** @deprecated usar ROULETTE_PURCHASE_HOURS */
export const ROULETTE_PURCHASE_MINUTES = ROULETTE_PURCHASE_HOURS * 60;

export type RoulettePrizeId =
  | "discount_5"
  | "discount_7"
  | "discount_50000"
  | "kit_viajero"
  | "tour_regalo"
  | "regalo_sorpresa"
  | "no_luck";

export type RouletteSegment = {
  index: number;
  id: RoulettePrizeId;
  label: string;
  shortLabel: string;
  /** Líneas en la ruleta (1 o 2, centradas; definidas explícitamente) */
  wheelLines: string[];
  color: string;
};

export const ROULETTE_SEGMENTS: RouletteSegment[] = [
  { index: 0, id: "discount_5", label: "5% de descuento", shortLabel: "5% OFF", wheelLines: ["5% de", "descuento"], color: "#0d9488" },
  { index: 1, id: "kit_viajero", label: "Kit viajero de regalo", shortLabel: "Kit viajero", wheelLines: ["Kit viajero"], color: "#7c3aed" },
  { index: 2, id: "no_luck", label: "Para la próxima tendré más suerte", shortLabel: "Próxima vez", wheelLines: ["Para la próxima", "tendré más suerte"], color: "#1e293b" },
  { index: 3, id: "tour_regalo", label: "Tour adicional de regalo", shortLabel: "Tour regalo", wheelLines: ["Tour de", "regalo"], color: "#ea580c" },
  { index: 4, id: "discount_50000", label: "$50.000 de descuento", shortLabel: "$50.000", wheelLines: ["$50.000", "de descuento"], color: "#ca8a04" },
  { index: 5, id: "regalo_sorpresa", label: "Regalo sorpresa", shortLabel: "Sorpresa", wheelLines: ["Regalo sorpresa"], color: "#db2777" },
  { index: 6, id: "discount_7", label: "7% de descuento", shortLabel: "7% OFF", wheelLines: ["7% de", "descuento"], color: "#16a34a" },
  { index: 7, id: "no_luck", label: "Para la próxima tendré más suerte", shortLabel: "Próxima vez", wheelLines: ["Para la próxima", "tendré más suerte"], color: "#334155" },
];

export function isRoulettePrizeId(value: string | null | undefined): value is RoulettePrizeId {
  return ROULETTE_SEGMENTS.some((s) => s.id === value) || value === "no_luck";
}

export function rouletteExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + ROULETTE_PURCHASE_HOURS * 60 * 60 * 1000);
}

export function roulettePurchaseTimeLabel(): string {
  return `${ROULETTE_PURCHASE_HOURS} horas`;
}

export function getRouletteDiscount(
  prize: RoulettePrizeId,
): { type: DiscountType; value: number } | null {
  if (prize === "discount_5") return { type: "percent", value: 5 };
  if (prize === "discount_7") return { type: "percent", value: 7 };
  if (prize === "discount_50000") return { type: "fixed", value: 50_000 };
  return null;
}

export function isRouletteDiscountPrize(prize: RoulettePrizeId): boolean {
  return getRouletteDiscount(prize) !== null;
}

export function isRouletteGiftPrize(prize: RoulettePrizeId): boolean {
  return prize === "kit_viajero" || prize === "regalo_sorpresa" || prize === "tour_regalo";
}

export function roulettePrizeHasBenefit(prize: RoulettePrizeId): boolean {
  return prize !== "no_luck";
}

export function roulettePrizeLabel(prize: RoulettePrizeId): string {
  const seg = ROULETTE_SEGMENTS.find((s) => s.id === prize);
  return seg?.label ?? prize;
}
