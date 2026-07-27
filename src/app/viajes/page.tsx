import Image from "next/image";
import Link from "next/link";
import { DESTINATION_HUBS } from "@/lib/destination-hubs";
import { SEASONAL_LANDINGS } from "@/lib/seasonal-landings";
import { pageMetadata } from "@/lib/seo-metadata";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

export const metadata = pageMetadata({
  path: "/viajes",
  title: "Viajes y destinos | Universo Nómada®",
  description:
    "Explora viajes a Chile, Rapa Nui, Atacama, Patagonia, Cusco, Mendoza y más. Paquetes boutique con Universo Nómada® — agencia SERNATUR.",
  keywords: [
    "viajes chile",
    "viajes a chile",
    "destinos universo nomada",
    "paquetes turísticos chile",
    "viajes sudamérica",
  ],
});

export default function ViajesIndexPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", path: "/" },
          { name: "Viajes", path: "/viajes" },
        ]}
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-8">
          <p className="text-teal text-xs font-bold uppercase tracking-widest mb-2">
            Universo Nómada®
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Viajes y destinos
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl leading-relaxed">
            Guías por destino y campañas especiales. Elige tu próxima ruta y cotiza con asesoría boutique.
          </p>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 space-y-12">
          <section aria-labelledby="hubs-heading">
            <h2 id="hubs-heading" className="text-xl font-bold text-slate-900 mb-5">
              Destinos
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
              {DESTINATION_HUBS.map((hub) => (
                <li key={hub.slug}>
                  <Link
                    href={`/viajes/${hub.slug}`}
                    className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-teal/40 transition-colors h-full"
                  >
                    <div className="relative h-40">
                      <Image
                        src={hub.image}
                        alt={hub.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 320px"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 group-hover:text-teal transition-colors">
                        {hub.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{hub.subtitle}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="seasonal-heading">
            <h2 id="seasonal-heading" className="text-xl font-bold text-slate-900 mb-5">
              Campañas y salidas
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3 list-none p-0 m-0">
              {SEASONAL_LANDINGS.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/viajes/${l.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-teal/40 transition-colors"
                  >
                    <p className="font-semibold text-slate-900">{l.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{l.subtitle}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-center">
            <Link href="/#destinos" className="text-teal font-semibold hover:underline">
              Ver todos los paquetes en la home
            </Link>
          </p>
        </main>
      </div>
    </>
  );
}
