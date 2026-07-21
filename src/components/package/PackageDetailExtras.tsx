"use client";

import Image from "next/image";
import { CheckCircle, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { LiveTour } from "@/hooks/use-tour-by-id";
import { PackageGallery } from "@/components/package/PackageGallery";
import { PackageAccommodationsSection } from "@/components/package/PackageAccommodationsSection";
import { BundledIncludedToursBanner } from "@/components/package/BundledIncludedToursBanner";
import { visibleBundledIncludedTours } from "@/lib/tour-content";

type Props = {
  tour: LiveTour;
  selectedTours?: string[];
  onToggleTour?: (id: string) => void;
};

export function PackageDetailExtras({ tour, selectedTours = [], onToggleTour }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const includes = tour.includes?.length ? tour.includes : [];
  const excludes = tour.excludes?.length ? tour.excludes : [];
  const gallery = tour.gallery ?? [];
  const faq = tour.faq ?? [];
  const optional = tour.optionalTours ?? { pickCount: 0, options: [] };
  const bundledIncludedTours = visibleBundledIncludedTours(optional);

  return (
    <div className="space-y-8">
      {gallery.length > 0 && <PackageGallery images={gallery} />}

      {includes.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">¿Qué incluye?</h2>
          <div className="bg-gray-800 rounded-xl p-6 space-y-3">
            {includes.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {excludes.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">¿Qué no incluye?</h2>
          <div className="bg-gray-800 rounded-xl p-6 space-y-3">
            {excludes.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-5 w-5 border-2 border-red-500 rounded-full mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {bundledIncludedTours.length > 0 && !(optional.pickCount > 0 && optional.options.length > 0) && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Tours incluidos</h2>
          <BundledIncludedToursBanner tours={bundledIncludedTours} theme="dark" />
        </section>
      )}

      {optional.pickCount > 0 && optional.options.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-2">Tours a elección</h2>

          {bundledIncludedTours.length > 0 && (
            <BundledIncludedToursBanner tours={bundledIncludedTours} theme="dark" />
          )}

          <p className="text-teal mb-4 font-medium">
            Debes elegir {optional.pickCount} tour{optional.pickCount > 1 ? "s" : ""}
            {selectedTours.length > 0 && (
              <span className="text-gray-400 font-normal ml-2">
                ({selectedTours.length}/{optional.pickCount} seleccionados)
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {optional.options.map((opt) => {
              const selected = selectedTours.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onToggleTour?.(opt.id)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    selected ? "border-teal bg-teal/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    {opt.image && (
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                        <Image src={opt.image} alt={opt.name} fill className="object-cover" sizes="64px" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white leading-snug">{opt.name}</p>
                      {opt.description?.trim() ? (
                        <p className="text-sm text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {opt.description.trim()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <PackageAccommodationsSection
        tourId={tour.tourId}
        tourName={tour.name}
        fallbackPrice={tour.price}
      />

      {tour.pdfUrl && (
        <section>
          <a
            href={tour.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-teal/20 text-teal font-semibold px-5 py-3 rounded-xl hover:bg-teal/30 transition-colors"
          >
            <Download className="h-5 w-5" />
            Descargar PDF informativo
          </a>
        </section>
      )}

      {faq.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Preguntas frecuentes</h2>
          <div className="space-y-2">
            {faq.map((item, i) => (
              <div key={i} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-white pr-4">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-5 w-5 text-teal shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-gray-300 text-sm leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
