"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useEffect, useState } from "react";
import { CalendarDays, MessageCircle, Sparkles, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { type GroupTrip } from "@/lib/group-trips";
import {
  departureAvailabilityClass,
  departureAvailabilityLabel,
  normalizeDepartureAvailability,
} from "@/lib/group-departure-availability";
import { PriceOffer } from "@/components/PriceOffer";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl, translations } from "@/lib/translations";
import { gravitySpring } from "@/lib/motion-presets";
import { WAVE_COLORS } from "@/components/WildlifeBackground";
import { FlowField } from "@/components/motion/FlowField";
import { GravityReveal } from "@/components/motion/GravityReveal";

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");
const GROUP_TRIPS_ES = translations.es.groupTrips;

type TourCard = {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number | null;
};

type Props = {
  tourList: TourCard[];
  groupTourMeta: Record<string, { tourId: string; image: string }>;
};

function GroupTripsComingSoon({ g }: { g: Record<string, string> }) {
  const text = (key: keyof typeof GROUP_TRIPS_ES) =>
    (g[key] as string | undefined) || GROUP_TRIPS_ES[key] || "";
  const waUrl = buildWhatsAppUrl(text("comingSoonWhatsappMsg"));

  return (
    <GravityReveal delay={0.1} mode="drop">
      <motion.div
        className="max-w-4xl mx-auto"
        whileHover={{ y: -4, transition: gravitySpring }}
      >
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 px-6 sm:px-8 py-7 sm:py-8 bg-gradient-to-r from-teal/15 via-white to-amber/10">
            <div className="flex sm:flex-col items-center gap-4 sm:gap-3 shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 border border-teal/20">
                <CalendarDays className="h-7 w-7 text-teal" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 text-amber-800 text-xs font-bold px-3 py-1.5 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                {text("comingSoonBadge")}
              </span>
            </div>

            <div className="flex-1 min-w-0 text-center">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {text("comingSoonTitle")}
              </h3>
              <p className="mt-2 text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                {text("comingSoonDescription")}
              </p>
              <p className="mt-2 text-xs sm:text-sm font-semibold text-teal-700 tracking-wide">
                {text("comingSoonDestinations")}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 sm:w-[220px] lg:w-[240px]">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] px-5 rounded-full bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-colors"
              >
                <MessageCircle className="h-5 w-5 shrink-0" />
                <span className="leading-tight text-center">{text("comingSoonNotify")}</span>
              </a>
              <Link
                href="#contacto"
                className="text-center text-sm font-semibold text-slate-500 hover:text-teal transition-colors"
              >
                {g.whatsapp} →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </GravityReveal>
  );
}

export function GroupTripsSection({ tourList, groupTourMeta }: Props) {
  const { t } = useLanguage();
  const g = t("groupTrips") as Record<string, string>;
  const [apiTrips, setApiTrips] = useState<GroupTrip[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/group-trips")
      .then((r) => (r.ok ? r.json() : { trips: [] }))
      .then((d) => {
        if (d?.trips?.length) setApiTrips(d.trips);
        else setApiTrips([]);
      })
      .catch(() => setApiTrips([]))
      .finally(() => setLoaded(true));
  }, []);

  const trips = useMemo(() => {
    if (!apiTrips?.length) return [];
    return apiTrips.map((trip) => {
      const live = tourList.find((t) => t.id === trip.tourId);
      return live
        ? { ...trip, price: live.price, image: live.image, originalPrice: live.originalPrice }
        : trip;
    });
  }, [tourList, apiTrips]);

  const borderColor = (name: string) =>
    name === "San Pedro de Atacama"
      ? "border-orange-300"
      : name === "Uyuni"
        ? "border-cyan-300"
        : "border-purple-300";

  const showComingSoon = loaded && trips.length === 0;

  return (
    <section
      id="viajes-grupales"
      className={`relative overflow-hidden ${
        showComingSoon ? "py-12 sm:py-14 pb-14 sm:pb-16" : "py-16 sm:py-24 pb-20 sm:pb-24"
      }`}
      style={{ backgroundColor: WAVE_COLORS.groupTrips }}
    >
      <FlowField variant="cool" className="opacity-45" intensity="medium" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <GravityReveal>
          <div
            className={`text-center max-w-2xl mx-auto ${
              showComingSoon ? "mb-8 sm:mb-9" : "mb-10 sm:mb-12"
            }`}
          >
            <span className="inline-block bg-teal text-white font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
              {g.title}
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-tight">{g.subtitle}</h2>
            <p className="mt-4 text-white/65 text-lg max-w-xl mx-auto leading-relaxed">{g.description}</p>
          </div>
        </GravityReveal>

        {!loaded ? (
          <div className="max-w-4xl mx-auto rounded-2xl bg-white/10 border border-white/10 h-28 sm:h-32 animate-pulse" />
        ) : trips.length === 0 ? (
          <GroupTripsComingSoon g={g} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {trips.map((trip, i) => (
              <TripCard
                key={trip.name}
                trip={trip}
                delay={i * 0.15}
                borderClass={borderColor(trip.name)}
                g={g}
                discountsLabel={t("discounts").verDetalles}
                desdeLabel={t("destinations").desde}
                porPersonaLabel={t("destinations").porPersona}
                ahorrasLabel={t("priceOffer").ahorras}
                tourId={groupTourMeta[trip.name]?.tourId ?? trip.tourId}
                image={groupTourMeta[trip.name]?.image ?? trip.image}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TripCard({
  trip,
  delay,
  borderClass,
  g,
  discountsLabel,
  desdeLabel,
  porPersonaLabel,
  ahorrasLabel,
  tourId,
  image,
}: {
  trip: GroupTrip & { originalPrice?: number | null };
  delay: number;
  borderClass: string;
  g: Record<string, string>;
  discountsLabel: string;
  desdeLabel: string;
  porPersonaLabel: string;
  ahorrasLabel: string;
  tourId: string;
  image: string;
}) {
  const whatsappMsg = `${g.whatsappMsg} ${trip.name}`;
  const reservationLabel =
    trip.reservation === 100000 ? g.reservation100 : g.reservation200;

  return (
    <GravityReveal delay={delay}>
      <motion.div
        whileHover={{ y: -8, transition: gravitySpring }}
        className={`group relative bg-white/95 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-500 overflow-hidden border-2 premium-card-lift ${borderClass}`}
      >
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {reservationLabel}
          </span>
        </div>

        <div className="relative h-80 overflow-hidden rounded-t-2xl">
          <Image src={image} alt={trip.name} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 1024px) 100vw, 33vw" />
          <div className={`absolute inset-0 bg-gradient-to-t ${trip.gradient} via-transparent to-transparent opacity-80`} />
          <div className="absolute top-4 right-4">
            <span className="bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">
              {trip.duration}
            </span>
          </div>
          <div className="absolute bottom-4 left-4">
            <h3 className="text-white font-black text-2xl mb-1">{trip.name}</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-white/90 text-sm">(4.9)</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
              <CalendarDays className="h-4 w-4 text-red-500" />
              <span className="font-semibold">{g.datesTitle}</span>
            </div>
            <div className="space-y-2">
              {trip.departures.map((dep) => {
                const status = normalizeDepartureAvailability(
                  dep.availabilityStatus,
                  dep.spotsLeft,
                );
                return (
                <div
                  key={dep.date}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2"
                >
                  <span className="text-gray-700 text-sm font-medium">{dep.date}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${departureAvailabilityClass(status)}`}
                  >
                    {departureAvailabilityLabel(status, {
                      available: g.spotsAvailable,
                      lastSpots: g.spotsLast,
                      soldOut: g.spotsSoldOut,
                    })}
                  </span>
                </div>
              );
              })}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
              <span className="font-semibold">{g.includesTitle}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {trip.includes.slice(0, 4).map((item) => (
                <div key={item} className="flex items-center gap-1 text-gray-600 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/70 border border-emerald-100 p-4">
              <PriceOffer
                price={trip.price}
                originalPrice={trip.originalPrice ?? undefined}
                desdeLabel={desdeLabel}
                porPersonaLabel={porPersonaLabel}
                ahorrasLabel={ahorrasLabel}
                size="md"
              />
              <p className="text-xs font-bold text-black mt-2 bg-white inline-block px-2.5 py-1 rounded-full border border-slate-200">
                {g.reservationFrom} {formatCLP(trip.reservation)}
              </p>
            </div>
            <Link href={`/detalle-paquete/${tourId}`} className="block">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl py-3 min-h-[48px] shadow-md shadow-emerald-500/20">
                {discountsLabel}
              </Button>
            </Link>
            <AddToCartButton
              tourId={tourId}
              tourName={`${trip.name} (Grupal)`}
              image={image}
              basePrice={trip.price}
              duration={trip.duration}
              className="min-h-[48px] rounded-xl"
            />
            <a
              href={buildWhatsAppUrl(whatsappMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm font-semibold text-teal-700 hover:text-teal-900 py-2"
            >
              {g.whatsapp} →
            </a>
          </div>
        </div>
      </motion.div>
    </GravityReveal>
  );
}
