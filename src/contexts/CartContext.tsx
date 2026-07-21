"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AddToCartDialog } from "@/components/AddToCartDialog";
import { CartSheet } from "@/components/CartSheet";

export type TourForCart = {
  tourId: string;
  tourName: string;
  image: string;
  basePrice: number;
  duration?: string;
  /** Tours a elección preseleccionados desde la ficha del paquete */
  preselectedOptionalTours?: string[];
};

type CartContextValue = {
  openAddToCart: (tour: TourForCart) => void;
  openCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [selectedTour, setSelectedTour] = useState<TourForCart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const openAddToCart = useCallback((tour: TourForCart) => setSelectedTour(tour), []);
  const openCart = useCallback(() => setCartOpen(true), []);

  return (
    <CartContext.Provider value={{ openAddToCart, openCart }}>
      {children}
      <AddToCartDialog
        tour={selectedTour}
        open={!!selectedTour}
        onOpenChange={(open) => { if (!open) setSelectedTour(null); }}
        onAdded={() => { setSelectedTour(null); setCartOpen(true); }}
      />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
