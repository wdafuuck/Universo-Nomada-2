"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FlowField } from "@/components/motion/FlowField";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import { WAVE_COLORS } from "@/components/WildlifeBackground";

type HeroCinematicProps = {
  onPlanTrip: () => void;
  refreshKey?: number;
  initialImages?: string[];
};

/**
 * Hero liviano: sin framer-motion en el LCP (PageSpeed móvil).
 * Crossfade CSS + imagen WebP vía /api/img.
 */
export function HeroCinematic({
  onPlanTrip,
  refreshKey = 0,
  initialImages = [],
}: HeroCinematicProps) {
  const { t } = useLanguage();
  const h = t("hero");
  const [slide, setSlide] = useState(0);
  const [images, setImages] = useState<string[]>(initialImages);

  useEffect(() => {
    if (refreshKey === 0) return;
    fetch(`/api/hero-slides?t=${refreshKey}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const urls = (data.slides ?? [])
          .map((s: { imageUrl: string }) => s.imageUrl)
          .filter(Boolean);
        if (urls.length > 0) setImages(urls);
      })
      .catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    if (images.length === 0) return;
    setSlide(0);
    const id = setInterval(() => setSlide((s) => (s + 1) % images.length), 7000);
    return () => clearInterval(id);
  }, [images]);

  const slides = images;

  return (
    <section
      id="inicio"
      className="relative overflow-hidden"
      style={{ backgroundColor: WAVE_COLORS.amberLight }}
    >
      <svg aria-hidden className="absolute w-0 h-0" focusable="false">
        <defs>
          <clipPath id="hero-bottom-wave-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0 L1,0 L1,0.96 C0.75,0.91 0.25,0.994 0,0.96 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="relative min-h-dvh"
        style={{
          clipPath: "url(#hero-bottom-wave-clip)",
          WebkitClipPath: "url(#hero-bottom-wave-clip)",
        }}
      >
        <FlowField variant="aurora" intensity="subtle" className="max-md:hidden opacity-70" />

        <div className="absolute inset-0">
          {slides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === slide ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={i !== slide}
            >
              <UploadAwareImage
                src={src}
                alt={
                  i === slide
                    ? `${h.line1} — destino turístico Universo Nómada`
                    : ""
                }
                fill
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : "low"}
                quality={62}
                sizes="(max-width: 768px) 100vw, 100vw"
                className="object-cover object-[center_20%]"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-linear-to-b from-black/25 via-black/5 to-black/55" />
          <div className="absolute inset-0 bg-linear-to-r from-navy/25 via-transparent to-teal/10 mix-blend-overlay" />
        </div>

        <div className="absolute top-1/2 right-4 sm:right-8 z-20 flex flex-col gap-2 -translate-y-1/2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === slide ? "w-8 bg-teal shadow-lg shadow-teal/50" : "w-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/70 via-black/35 to-transparent pt-28 sm:pt-36 pb-10 sm:pb-14">
          <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 text-center">
            <h1 className="text-white leading-[1.08] tracking-tight">
              <span className="hero-title-line block text-3xl sm:text-5xl md:text-6xl font-bold drop-shadow-2xl">
                {h.line1}
              </span>
              {h.line2 ? (
                <span className="hero-title-line block text-3xl sm:text-5xl md:text-6xl font-bold text-white/95 mt-1 sm:mt-2 drop-shadow-2xl">
                  {h.line2}
                </span>
              ) : null}
            </h1>

            <p className="mt-4 sm:mt-5 text-white/85 text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
              {h.subtitle}
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 max-w-xl sm:max-w-2xl mx-auto w-full">
              <a href="#destinos" className="flex-1">
                <span className="hero-cta-glow flex w-full min-h-13 sm:min-h-14 rounded-full bg-linear-to-r from-amber to-orange-500 hover:from-amber-dark hover:to-orange-600 text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-4 shadow-2xl shadow-amber/30 items-center justify-center transition-all">
                  {h.ctaWhatsapp}
                </span>
              </a>
              <button type="button" onClick={onPlanTrip} className="flex-1">
                <span className="flex w-full min-h-13 sm:min-h-14 rounded-full bg-white text-slate-900 hover:bg-amber-50 font-bold text-base sm:text-lg px-6 sm:px-8 py-4 shadow-xl items-center justify-center transition-all border border-white/20">
                  {h.ctaPlan}
                </span>
              </button>
            </div>

            <p className="mt-5 sm:mt-6 text-white/60 text-sm" suppressHydrationWarning>
              {h.trust}
            </p>

            <div className="mt-5 sm:mt-6 text-white/40 flex flex-col items-center gap-1">
              <span className="text-[10px] tracking-[0.25em] uppercase" suppressHydrationWarning>
                {h.scroll}
              </span>
              <ChevronDown className="h-4 w-4 scroll-gravity" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
