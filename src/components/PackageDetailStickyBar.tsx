"use client";

import { MessageCircle, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { buildWhatsAppUrl } from "@/lib/translations";
import { AddToCartButton } from "@/components/AddToCartButton";
import { gravitySpring } from "@/lib/motion-presets";

type Props = {
  tourId: string;
  tourName: string;
  image: string;
  basePrice: number;
  duration?: string;
  preselectedOptionalTours?: string[];
};

export function PackageDetailStickyBar({
  tourId,
  tourName,
  image,
  basePrice,
  duration,
  preselectedOptionalTours,
}: Props) {
  const msg = `Hola! Me interesa el paquete ${tourName}. ¿Me ayudan a elegir fechas y opciones?`;
  const wa = buildWhatsAppUrl(msg);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={gravitySpring}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-teal/20 bg-gray-950/95 backdrop-blur-md px-3 py-2.5 flex gap-2 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
    >
      <motion.a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl bg-[#25D366] text-white font-bold text-sm shrink-0 shadow-lg shadow-emerald-900/30"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </motion.a>
      <AddToCartButton
        tourId={tourId}
        tourName={tourName}
        image={image}
        basePrice={basePrice}
        duration={duration}
        preselectedOptionalTours={preselectedOptionalTours}
        variant="primary"
        className="flex-1 min-h-[48px] rounded-xl font-bold gap-2 shadow-lg shadow-teal/20"
      >
        <span className="flex items-center justify-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Reservar
        </span>
      </AddToCartButton>
    </motion.div>
  );
}
