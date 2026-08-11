"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export type PromoSlide = {
  id: number;
  postUrl: string;
  caption: string;
  imageUrl: string;
};

export function PromoSliderSection() {
  const { t } = useLanguage();
  const copy = t("promoSlider");
  const [slides, setSlides] = useState<PromoSlide[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("/api/instagram")
      .then((r) => r.json())
      .then((data) => setSlides(data.posts ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if (!api || slides.length <= 1) return;
    const timer = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(timer);
  }, [api, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section id="promociones-slider" className="py-14 sm:py-20 bg-gradient-to-b from-white to-amber-50/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <span className="text-teal-ink font-semibold text-sm uppercase tracking-widest">{copy.badge}</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{copy.title}</h2>
          <p className="mt-2 text-slate-600 max-w-lg mx-auto text-sm sm:text-base">{copy.subtitle}</p>
        </motion.div>

        <Carousel setApi={setApi} opts={{ loop: true, align: "center" }} className="w-full">
          <CarouselContent>
            {slides.map((slide) => {
              const inner = (
                <div className="relative aspect-[4/5] sm:aspect-[16/10] rounded-2xl overflow-hidden shadow-xl bg-slate-100">
                  <Image
                    src={slide.imageUrl || "/images/atacama-new.png"}
                    alt={slide.caption || "Promoción"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 896px"
                    priority={slide.id === slides[0]?.id}
                  />
                  {slide.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 sm:p-6">
                      <p className="text-white font-semibold text-sm sm:text-base line-clamp-2">{slide.caption}</p>
                    </div>
                  )}
                </div>
              );

              return (
                <CarouselItem key={slide.id}>
                  {slide.postUrl ? (
                    <a href={slide.postUrl} target="_blank" rel="noopener noreferrer" className="block">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </CarouselItem>
              );
            })}
          </CarouselContent>
          {slides.length > 1 && (
            <>
              <CarouselPrevious className="left-2 sm:-left-12 border-slate-200 bg-white/90 hover:bg-white text-slate-800" />
              <CarouselNext className="right-2 sm:-right-12 border-slate-200 bg-white/90 hover:bg-white text-slate-800" />
            </>
          )}
        </Carousel>

        {slides.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "w-8 bg-teal" : "w-2 bg-slate-300"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
