"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { gravitySpring } from "@/lib/motion-presets";
import type { PackageGalleryImage } from "@/lib/tour-content";

type Props = {
  images: PackageGalleryImage[];
};

export function PackageGallery({ images }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const openAt = (index: number) => {
    setStartIndex(index);
    setCurrent(index);
    setLightboxOpen(true);
  };

  const close = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") api?.scrollPrev();
      if (e.key === "ArrowRight") api?.scrollNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, close, api]);

  useEffect(() => {
    if (!api || !lightboxOpen) return;
    api.scrollTo(startIndex, true);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, lightboxOpen, startIndex]);

  if (images.length === 0) return null;

  return (
    <>
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Galería</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image, i) => (
            <motion.button
              key={`${image.url}-${i}`}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, ...gravitySpring }}
              whileHover={{ scale: 1.02, transition: gravitySpring }}
              onClick={() => openAt(i)}
              className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              aria-label={`Ver foto ${i + 1} en grande`}
            >
              <Image
                src={image.url}
                alt={`Galería ${i + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ objectPosition: image.objectPosition }}
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
              <span className="absolute bottom-2 right-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-4 w-4" />
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/95"
            onClick={close}
            aria-label="Cerrar galería"
          />

          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative z-10 w-full max-w-5xl">
            <Carousel
              setApi={setApi}
              opts={{ loop: images.length > 1, startIndex }}
              className="w-full"
            >
              <CarouselContent className="ml-0">
                {images.map((image, i) => (
                  <CarouselItem key={`${image.url}-lb-${i}`} className="pl-0 basis-full">
                    <div className="relative w-full h-[min(85vh,720px)]">
                      <Image
                        src={image.url}
                        alt={`Foto ${i + 1}`}
                        fill
                        className="object-contain"
                        style={{ objectPosition: image.objectPosition }}
                        sizes="100vw"
                        priority={i === startIndex}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => api?.scrollPrev()}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                  <button
                    type="button"
                    onClick={() => api?.scrollNext()}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                    aria-label="Foto siguiente"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </button>
                </>
              )}
            </Carousel>

            <p className="text-center text-white/70 text-sm mt-4 tabular-nums">
              {current + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
