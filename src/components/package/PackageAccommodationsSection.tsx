"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { useTourPricing } from "@/hooks/use-tour-pricing";
import {
  getAccommodationAdult2Pax,
  getActiveAccommodations,
} from "@/lib/tour-pricing";
import { HotelStars } from "@/components/HotelStars";

type Props = {
  tourId: string;
  tourName: string;
  fallbackPrice?: number;
};

function formatCLP(n: number) {
  return "$" + n.toLocaleString("es-CL");
}

export function PackageAccommodationsSection({ tourId, tourName, fallbackPrice }: Props) {
  const config = useTourPricing(tourId, tourName, fallbackPrice);
  const accommodations = getActiveAccommodations(config);

  if (accommodations.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-2">Opciones de alojamiento</h2>
      <p className="text-gray-400 text-sm mb-5 leading-relaxed">
        El precio del paquete <strong className="text-gray-300 font-semibold">varía según el tipo de alojamiento</strong> que elijas al reservar.
        Estas son algunas de las opciones disponibles:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accommodations.map((acc) => {
          const price2pax = getAccommodationAdult2Pax(acc);
          return (
            <div
              key={acc.id}
              className="rounded-xl border border-gray-700 bg-gray-800 overflow-hidden hover:border-teal/40 transition-colors"
            >
              <div className="relative aspect-[16/10] bg-gray-900">
                {acc.image ? (
                  <Image
                    src={acc.image}
                    alt={acc.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 320px"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2">
                    <Building2 className="h-10 w-10 text-gray-600" />
                    <span className="text-xs">Foto próximamente</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white leading-snug">{acc.name}</p>
                  <HotelStars stars={acc.stars} size="md" />
                </div>
                {price2pax > 0 && (
                  <p className="text-teal text-sm font-medium mt-1.5">
                    Desde {formatCLP(price2pax)} / persona
                  </p>
                )}
                {acc.includesBreakfast !== false && (
                  <p className="text-gray-500 text-xs mt-1">Desayuno incluido</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
