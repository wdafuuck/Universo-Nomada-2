import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { pageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/cotizacion-enviada",
  title: "Cotización enviada | Universo Nómada®",
  description: "Recibimos tu solicitud. Te contactaremos pronto por WhatsApp o correo.",
  noindex: true,
});

const WA =
  "https://wa.me/56974636396?text=Hola!%20Acabo%20de%20enviar%20una%20cotizaci%C3%B3n%20en%20la%20web.";

export default function CotizacionEnviadaPage() {
  return (
    <main id="main-content" className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-lg w-full text-center rounded-3xl border border-emerald-100 bg-white shadow-xl p-8 sm:p-10">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" aria-hidden />
        <h1 className="mt-4 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          ¡Cotización enviada!
        </h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Gracias. Recibimos tu solicitud y te contactaremos pronto por WhatsApp o correo
          (normalmente en menos de 24 horas).
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white font-bold px-6 py-3 text-sm hover:bg-[#1ebe57] transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
          </a>
          <Link
            href="/#destinos"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 text-slate-700 font-semibold px-6 py-3 text-sm hover:bg-slate-50 transition-colors"
          >
            Seguir explorando
          </Link>
        </div>
      </div>
    </main>
  );
}
