"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { SEASONAL_LANDINGS } from "@/lib/seasonal-landings";

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

export function SeasonalCampaignsSection() {
  return (
    <section id="campanas" className="py-16 sm:py-20 bg-gradient-to-b from-amber-50/80 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-[0.2em]">
            <Sparkles className="h-3.5 w-3.5" /> Campañas destacadas
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Experiencias de temporada
          </h2>
          <p className="mt-3 text-slate-500 text-lg max-w-2xl mx-auto">
            Salidas especiales con cupos limitados, precios anticipados y logística lista para reservar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SEASONAL_LANDINGS.map((landing) => (
            <Link
              key={landing.slug}
              href={`/viajes/${landing.slug}`}
              className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-teal/30 transition-all"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src={landing.image}
                  alt={landing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-teal/90 px-2.5 py-1 rounded-full">
                  Desde {formatCLP(landing.priceFrom)}
                </span>
              </div>
              <div className="flex flex-col flex-1 p-5">
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal transition-colors">
                  {landing.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{landing.subtitle}</p>
                <p className="text-sm text-slate-600 mt-3 line-clamp-2 flex-1">{landing.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Válido hasta {landing.validUntil}
                  </span>
                  <span className="inline-flex items-center gap-1 text-teal font-semibold group-hover:gap-2 transition-all">
                    Ver campaña <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
