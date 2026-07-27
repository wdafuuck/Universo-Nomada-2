"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Clock } from "lucide-react";
import type { SeasonalLanding } from "@/lib/seasonal-landings";
import { buildWhatsAppUrl } from "@/lib/translations";
import { AddToCartButton } from "@/components/AddToCartButton";
import { PriceOffer } from "@/components/PriceOffer";
import { PromoUrgency } from "@/components/PromoUrgency";
import { ReferralCapture } from "@/components/ReferralCapture";

export function SeasonalLandingPage({ landing }: { landing: SeasonalLanding }) {
  return (
    <div className="min-h-screen bg-white">
      <ReferralCapture />
      <header className="relative h-[50vh] min-h-[320px]">
        <Image src={landing.image} alt={landing.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070f1a] via-[#070f1a]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm">
              <ArrowLeft className="h-4 w-4" /> Volver al inicio
            </Link>
            <Link href="/viajes" className="text-white/50 hover:text-white text-sm">
              Todos los destinos
            </Link>
          </div>
          <p className="text-teal text-xs font-bold uppercase tracking-widest mb-2">{landing.subtitle}</p>
          <h1 className="text-3xl sm:text-5xl font-black text-white">{landing.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <p className="text-lg text-slate-600 leading-relaxed">{landing.description}</p>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/60 p-6">
          <PriceOffer
            price={landing.priceFrom}
            desdeLabel="Desde"
            porPersonaLabel="por persona"
            ahorrasLabel="Ahorras"
            size="lg"
          />
          <PromoUrgency validUntil={landing.validUntil} spotsLeft={6} />
        </div>

        <ul className="space-y-3">
          {landing.highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 text-slate-700">
              <Check className="h-5 w-5 text-teal shrink-0 mt-0.5" />
              {h}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={buildWhatsAppUrl(landing.whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center min-h-[52px] px-6 py-3 rounded-xl bg-teal hover:bg-teal/90 text-[#070f1a] font-bold transition-colors"
          >
            Cotizar por WhatsApp
          </a>
          <Link
            href={`/detalle-paquete/${landing.tourId}`}
            className="flex-1 inline-flex items-center justify-center min-h-[52px] px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-800 font-bold hover:bg-slate-50"
          >
            Ver detalle del paquete
          </Link>
        </div>

        <AddToCartButton
          tourId={landing.tourId}
          tourName={landing.title}
          image={landing.image}
          basePrice={landing.priceFrom}
          className="w-full rounded-xl min-h-[48px]"
        />

        <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" /> Oferta válida hasta {landing.validUntil}
        </p>
      </main>
    </div>
  );
}
