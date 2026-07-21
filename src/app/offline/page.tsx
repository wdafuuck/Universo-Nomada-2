import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/offline",
  title: "Sin conexión | Universo Nómada®",
  description: "No hay conexión a internet. Escríbenos por WhatsApp para cotizar tu viaje.",
  noindex: true,
});

export default function OfflinePage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-slate-50">
      <h1 className="text-2xl font-bold text-slate-900">Sin conexión</h1>
      <p className="mt-3 text-slate-600 max-w-md">
        No pudimos cargar la página. Revisa tu internet o contáctanos directamente.
      </p>
      <a
        href="https://wa.me/56974636396?text=Hola!%20Quiero%20cotizar%20un%20viaje"
        className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-teal px-6 font-bold text-navy"
      >
        WhatsApp
      </a>
      <Link href="/" className="mt-4 text-teal font-semibold text-sm hover:underline">
        Reintentar
      </Link>
    </main>
  );
}
