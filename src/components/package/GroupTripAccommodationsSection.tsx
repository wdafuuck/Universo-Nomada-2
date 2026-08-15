"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import type { GroupAccommodationInfo } from "@/lib/group-trip-content";

type Props = {
  items: GroupAccommodationInfo[];
};

export function GroupTripAccommodationsSection({ items }: Props) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-2">Alojamientos</h2>
      <p className="text-gray-400 text-sm mb-5 leading-relaxed">
        Hoteles y hospedajes previstos para este viaje grupal.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((acc) => (
          <div
            key={acc.id}
            className="rounded-xl border border-gray-700 bg-gray-800 overflow-hidden"
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
              <p className="font-semibold text-white leading-snug">{acc.name}</p>
              {acc.description.trim() ? (
                <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
                  {acc.description.trim()}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
