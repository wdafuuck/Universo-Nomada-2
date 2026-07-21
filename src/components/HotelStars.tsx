import { Star } from "lucide-react";

export type HotelStarRating = 2 | 3 | 4 | 5;

export function normalizeHotelStars(value: unknown): HotelStarRating | null {
  const n = Number(value);
  if (n === 2 || n === 3 || n === 4 || n === 5) return n;
  return null;
}

type Props = {
  stars?: number | null;
  className?: string;
  size?: "sm" | "md";
};

/** Muestra 2–5 estrellas doradas al lado del nombre del hotel. */
export function HotelStars({ stars, className = "", size = "sm" }: Props) {
  const rating = normalizeHotelStars(stars);
  if (!rating) return null;

  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-0.5 shrink-0 ${className}`}
      aria-label={`${rating} estrellas`}
      title={`${rating} estrellas`}
    >
      {Array.from({ length: rating }, (_, i) => (
        <Star key={i} className={`${iconClass} fill-amber-400 text-amber-400`} aria-hidden />
      ))}
    </span>
  );
}
