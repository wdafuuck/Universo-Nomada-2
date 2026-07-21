"use client";

import { ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

type Props = {
  tourId: string;
  tourName: string;
  image: string;
  basePrice: number;
  duration?: string;
  preselectedOptionalTours?: string[];
  className?: string;
  variant?: "primary" | "outline" | "navy";
  children?: React.ReactNode;
};

export function AddToCartButton({
  tourId,
  tourName,
  image,
  basePrice,
  duration,
  preselectedOptionalTours,
  className = "",
  variant = "outline",
  children,
}: Props) {
  const { t } = useLanguage();
  const { openAddToCart } = useCart();

  const variants = {
    primary: "bg-gradient-to-r from-amber to-orange-500 hover:from-amber-dark hover:to-orange-600 text-white font-bold shadow-md",
    outline: "border-2 border-teal text-teal hover:bg-teal hover:text-white font-bold",
    navy: "bg-navy hover:bg-navy-light text-white font-bold",
  };

  return (
    <button
      type="button"
      onClick={() =>
        openAddToCart({
          tourId,
          tourName,
          image,
          basePrice,
          duration,
          preselectedOptionalTours,
        })
      }
      className={`w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.02] ${variants[variant]} ${className}`}
    >
      {!children && <ShoppingCart className="h-4 w-4" />}
      {children ?? t("cart").addToCart}
    </button>
  );
}
