"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, ExternalLink, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GoogleReview, GoogleReviewsPayload } from "@/lib/google-reviews";
import {
  googleReviews as fallbackReviews,
  GOOGLE_REVIEWS_URL,
} from "@/lib/google-reviews";
import { WAVE_COLORS } from "@/components/WildlifeBackground";
import { FlowField } from "@/components/motion/FlowField";
import { gravitySpring, luxuryEase } from "@/lib/motion-presets";

function avatarFallback(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function ReviewAvatar({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(!src);
  const isGoogle = src.includes("googleusercontent.com");

  if (failed || !src) {
    return (
      <div
        className="h-14 w-14 rounded-full ring-2 ring-white/30 bg-teal/25 flex items-center justify-center text-white font-bold text-sm shrink-0"
        aria-hidden
      >
        {avatarFallback(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={56}
      height={56}
      className="h-14 w-14 rounded-full ring-2 ring-white/30 object-cover bg-white/10 shrink-0"
      referrerPolicy={isGoogle ? "no-referrer" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

function SlidePhoto({ src, index }: { src: string; index: number }) {
  const [failed, setFailed] = useState(false);
  const isStaticAsset = src.startsWith("/") && !src.startsWith("/api/");

  if (failed) return null;

  if (isStaticAsset) {
    return (
      <Image
        src={src}
        alt={`Foto de viajero ${index + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 720px"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={`Foto de cliente ${index + 1}`}
      className="absolute inset-0 h-full w-full object-cover"
      referrerPolicy={src.includes("googleusercontent.com") ? "no-referrer" : undefined}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

const reviewSlide: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    y: 24,
    scale: 0.96,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: gravitySpring,
  },
  exit: (dir: number) => ({
    x: dir < 0 ? 80 : -80,
    opacity: 0,
    y: -16,
    scale: 0.98,
    filter: "blur(4px)",
    transition: { duration: 0.35, ease: luxuryEase },
  }),
};

type TravelerPhotosPanelProps = {
  photos: string[];
  googleMapsUrl: string;
  title: string;
  photoPrev?: string;
  photoNext?: string;
};

function TravelerPhotosPanel({
  photos,
  googleMapsUrl,
  title,
  photoPrev,
  photoNext,
}: TravelerPhotosPanelProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoDirection, setPhotoDirection] = useState(1);

  const goPhoto = useCallback(
    (dir: number) => {
      setPhotoDirection(dir);
      setPhotoIndex((i) => (i + dir + photos.length) % photos.length);
    },
    [photos.length],
  );

  useEffect(() => {
    if (photos.length <= 1) return;
    const id = setInterval(() => goPhoto(1), 5000);
    return () => clearInterval(id);
  }, [goPhoto, photos.length]);

  if (photos.length === 0) return null;

  const photo = photos[photoIndex];

  return (
    <div className="flex flex-col h-full">
      <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3 text-center md:text-left">
        {title}
      </p>
      <motion.a
        key={photo}
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, x: photoDirection > 0 ? 20 : -20, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: luxuryEase }}
        className="relative flex-1 min-h-[140px] sm:min-h-[160px] md:min-h-[200px] rounded-xl overflow-hidden border border-white/20 shadow-lg bg-slate-900/50 block"
      >
        <SlidePhoto src={photo} index={photoIndex} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      </motion.a>

      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3" aria-label="Galería de fotos">
          <button
            type="button"
            onClick={() => goPhoto(-1)}
            className="min-h-11 min-w-11 rounded-full border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/15 transition-colors shrink-0"
            aria-label={photoPrev ?? "Foto anterior"}
          >
            <ChevronLeft className="h-4 w-4 text-white/90" />
          </button>
          <p className="text-xs font-semibold text-white/70 tabular-nums" aria-live="polite">
            {photoIndex + 1} / {photos.length}
          </p>
          <button
            type="button"
            onClick={() => goPhoto(1)}
            className="min-h-11 min-w-11 rounded-full border border-white/15 bg-white/5 flex items-center justify-center hover:bg-white/15 transition-colors shrink-0"
            aria-label={photoNext ?? "Foto siguiente"}
          >
            <ChevronRight className="h-4 w-4 text-white/90" />
          </button>
        </div>
      )}
    </div>
  );
}

export function GoogleReviewsSlider() {
  const { t, language } = useLanguage();
  const tr = t("reviews") as {
    title: string;
    googleReviews: string;
    viewAll: string;
    verifiedGoogle: string;
    reviewsCount: string;
    loading: string;
    travelerPhotos: string;
    photoPrev?: string;
    photoNext?: string;
    reviewPrev?: string;
    reviewNext?: string;
  };
  const [data, setData] = useState<GoogleReviewsPayload>({
    reviews: fallbackReviews,
    placePhotos: [],
    rating: 5,
    totalReviews: 28,
    placeName: "Universo Nómada",
    googleMapsUrl: GOOGLE_REVIEWS_URL,
    source: "fallback",
  });
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/google-reviews?lang=${language}`)
      .then((r) => r.json())
      .then((payload: GoogleReviewsPayload) => {
        setData(payload);
        setCurrent(0);
        setDirection(1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [language]);

  const reviews = data.reviews;
  const total = reviews.length;

  const goReview = useCallback(
    (dir: number) => {
      setDirection(dir);
      setCurrent((c) => (c + dir + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => goReview(1), 7000);
    return () => clearInterval(id);
  }, [goReview, total]);

  const review: GoogleReview | undefined = reviews[current];
  const hasTravelerPhotos = data.placePhotos.length > 0;
  const ratingDisplay = data.rating.toFixed(1);

  return (
    <section
      id="testimonios"
      className="relative py-14 sm:py-16 pb-16 sm:pb-20 overflow-hidden"
      style={{ backgroundColor: WAVE_COLORS.ocean }}
    >
      <FlowField variant="cool" className="opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800/90 to-[#0F172A] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-4">
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-semibold text-white/90">{tr.googleReviews}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-white">{ratingDisplay}</span>
            {data.totalReviews > 0 && (
              <span className="text-xs text-white/60">({data.totalReviews} {tr.reviewsCount})</span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">🏔️ {tr.title}</h2>
          {data.source === "google" && (
            <p className="mt-2 text-xs text-teal-300 font-medium inline-flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5" /> {tr.verifiedGoogle}
            </p>
          )}
        </motion.div>

        <div className="relative">
          <div
            className={`grid gap-5 items-stretch ${
              hasTravelerPhotos
                ? "grid-cols-1 sm:grid-cols-[1fr_minmax(140px,200px)]"
                : "grid-cols-1"
            }`}
          >
            <div className="relative bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-7 shadow-xl min-h-[200px] overflow-hidden flex flex-col">
              {loading ? (
                <div className="flex items-center justify-center h-36 text-white/50 text-sm">{tr.loading}</div>
              ) : !review ? (
                <div className="flex items-center justify-center h-36 text-white/50 text-sm">{tr.loading}</div>
              ) : (
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={review.id}
                    custom={direction}
                    variants={reviewSlide}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex items-start gap-4 flex-1"
                  >
                    <div className="relative shrink-0">
                      <ReviewAvatar src={review.photo} name={review.name} />
                      {data.source === "google" && (
                        <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {review.authorUrl ? (
                          <a
                            href={review.authorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-white hover:text-teal-300 transition-colors"
                          >
                            {review.name}
                          </a>
                        ) : (
                          <span className="font-semibold text-white">{review.name}</span>
                        )}
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-white/50 text-xs mb-2">{review.date}</p>
                      <p className="text-white/85 text-sm leading-relaxed line-clamp-6 sm:line-clamp-none">
                        &ldquo;{review.text}&rdquo;
                      </p>
                      {review.destination && (
                        <p className="text-teal-300 text-xs font-medium mt-2">{review.destination}</p>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Controles de reseñas dentro de la tarjeta (evita barra duplicada bajo fotos en móvil) */}
              {total > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => goReview(-1)}
                    className="h-10 w-10 rounded-full border border-white/20 bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label={tr.reviewPrev ?? "Reseña anterior"}
                  >
                    <ChevronLeft className="h-5 w-5 text-white/80" />
                  </button>

                  <p className="text-xs font-semibold text-white/70 tabular-nums" aria-live="polite">
                    {current + 1} / {total}
                  </p>

                  <button
                    type="button"
                    onClick={() => goReview(1)}
                    className="h-10 w-10 rounded-full border border-white/20 bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label={tr.reviewNext ?? "Reseña siguiente"}
                  >
                    <ChevronRight className="h-5 w-5 text-white/80" />
                  </button>
                </div>
              )}
            </div>

            <TravelerPhotosPanel
              photos={data.placePhotos}
              googleMapsUrl={data.googleMapsUrl}
              title={tr.travelerPhotos}
              photoPrev={tr.photoPrev}
              photoNext={tr.photoNext}
            />
          </div>

          <div className="text-center mt-6">
            <a
              href={data.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-teal-300 transition-colors"
            >
              {tr.viewAll} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
