"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import type { DestinationHub } from "@/lib/destination-hubs";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { getSeasonalLanding } from "@/lib/seasonal-landings";
import { buildWhatsAppUrl } from "@/lib/translations";
import { PriceOffer } from "@/components/PriceOffer";
import { ReferralCapture } from "@/components/ReferralCapture";

type RelatedBlog = { slug: string; title: string; excerpt: string; image: string };

type Props = { hub: DestinationHub; relatedBlogs?: RelatedBlog[] };

export function DestinationHubPage({ hub, relatedBlogs = [] }: Props) {
  const tours = hub.tourIds
    .map((id) => DEFAULT_TOURS.find((t) => t.tourId === id))
    .filter(Boolean) as typeof DEFAULT_TOURS;
  const seasonal = (hub.relatedSeasonalSlugs ?? [])
    .map((s) => getSeasonalLanding(s))
    .filter(Boolean);
  const minPrice = tours.length ? Math.min(...tours.map((t) => t.price)) : undefined;

  return (
    <div className="min-h-screen bg-white">
      <ReferralCapture />
      <header className="relative h-[48vh] min-h-[300px]">
        <Image src={hub.image} alt={hub.title} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070f1a] via-[#070f1a]/55 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <nav className="flex flex-wrap items-center gap-2 text-white/70 text-sm mb-4">
            <Link href="/" className="hover:text-white inline-flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Inicio
            </Link>
            <span aria-hidden>/</span>
            <Link href="/viajes" className="hover:text-white">Viajes</Link>
            <span aria-hidden>/</span>
            <span className="text-white/90">{hub.title}</span>
          </nav>
          <p className="text-teal text-xs font-bold uppercase tracking-widest mb-2">{hub.subtitle}</p>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">{hub.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {minPrice != null && (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/60 p-6">
            <PriceOffer
              price={minPrice}
              desdeLabel="Desde"
              porPersonaLabel="por persona"
              size="lg"
            />
          </div>
        )}

        <div className="space-y-4">
          {hub.paragraphs.map((p) => (
            <p key={p.slice(0, 48)} className="text-slate-600 text-base sm:text-lg leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        <ul className="space-y-3">
          {hub.highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 text-slate-700">
              <Check className="h-5 w-5 text-teal shrink-0 mt-0.5" />
              {h}
            </li>
          ))}
        </ul>

        {tours.length > 0 && (
          <section aria-labelledby="hub-packages">
            <h2 id="hub-packages" className="text-2xl font-black text-slate-900 mb-4">
              Paquetes disponibles
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 list-none p-0 m-0">
              {tours.map((tour) => (
                <li key={tour.tourId}>
                  <Link
                    href={`/detalle-paquete/${tour.tourId}`}
                    className="group flex gap-3 rounded-xl border border-slate-200 overflow-hidden hover:border-teal/40 transition-colors bg-white"
                  >
                    <div className="relative w-28 sm:w-32 shrink-0">
                      <Image
                        src={tour.image}
                        alt={tour.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <div className="py-3 pr-3 min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-snug group-hover:text-teal">
                        {tour.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{tour.subtitle}</p>
                      <p className="text-sm font-semibold text-teal mt-2">
                        Desde ${tour.price.toLocaleString("es-CL")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {seasonal.length > 0 && (
          <section aria-labelledby="hub-seasonal">
            <h2 id="hub-seasonal" className="text-xl font-bold text-slate-900 mb-3">
              Campañas y salidas especiales
            </h2>
            <ul className="space-y-2">
              {seasonal.map((s) =>
                s ? (
                  <li key={s.slug}>
                    <Link href={`/viajes/${s.slug}`} className="text-teal font-semibold hover:underline">
                      {s.title}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        )}

        {hub.faqs && hub.faqs.length > 0 && (
          <section aria-labelledby="hub-faq">
            <h2 id="hub-faq" className="text-xl font-bold text-slate-900 mb-4">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {hub.faqs.map((f) => (
                <div key={f.question} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900 text-sm">{f.question}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedBlogs.length > 0 && (
          <section aria-labelledby="hub-guides">
            <h2 id="hub-guides" className="text-xl font-bold text-slate-900 mb-3">
              Guías y artículos relacionados
            </h2>
            <ul className="space-y-3 list-none p-0 m-0">
              {relatedBlogs.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/blog/${b.slug}`}
                    className="flex gap-3 rounded-xl border border-slate-200 overflow-hidden hover:border-teal/40 transition-colors bg-white"
                  >
                    <div className="relative w-24 sm:w-28 shrink-0 min-h-[72px]">
                      <Image src={b.image} alt={b.title} fill className="object-cover" sizes="112px" />
                    </div>
                    <div className="py-3 pr-3 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm leading-snug hover:text-teal">
                        {b.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.excerpt}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Link href="/blog" className="text-sm font-semibold text-teal hover:underline">
                Ver todo el blog →
              </Link>
            </p>
          </section>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href={buildWhatsAppUrl(hub.whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-3 rounded-xl bg-teal hover:bg-teal/90 text-[#070f1a] font-bold transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Cotizar por WhatsApp
          </a>
          <Link
            href="/viajes"
            className="flex-1 inline-flex items-center justify-center min-h-[52px] px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-800 font-bold hover:bg-slate-50"
          >
            Ver todos los destinos
          </Link>
        </div>
      </main>
    </div>
  );
}
