import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/accesibilidad",
  title: "Accesibilidad | Universo Nómada®",
  description:
    "Compromiso de Universo Nómada® con la accesibilidad web: navegación con teclado, lectores de pantalla y subtítulos.",
});

export default function AccesibilidadPage() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <p className="text-teal font-semibold text-sm tracking-wide uppercase mb-3">Inclusión</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Accesibilidad web
        </h1>
        <p className="mt-4 text-slate-600 text-lg leading-relaxed">
          Trabajamos para que universonomada.cl sea usable por todas las personas, incluidas
          quienes usan lectores de pantalla, navegan solo con teclado o necesitan subtítulos.
        </p>

        <section className="mt-10 space-y-6 text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Qué ya incluye el sitio</h2>
            <ul className="mt-3 list-disc pl-5 space-y-2">
              <li>Enlace “Saltar al contenido” al inicio de cada página</li>
              <li>Idioma principal en español (<code className="text-sm bg-slate-100 px-1 rounded">lang=&quot;es&quot;</code>)</li>
              <li>Etiquetas en botones e iconos (carrito, menú, redes)</li>
              <li>Formularios con campos obligatorios y mensajes de error</li>
              <li>Textos alternativos en imágenes clave (logo, destinos, sello SERNATUR)</li>
              <li>Contraste reforzado en botones de acción (CTA naranja / WhatsApp)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Personas sordas o con discapacidad auditiva</h2>
            <p className="mt-2">
              La información esencial de paquetes, precios y cotización está en texto. Si publicamos
              videos o Reels en la web, priorizamos subtítulos. Para asesoría, puedes escribir por
              WhatsApp o correo (sin depender del audio).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Personas ciegas o con baja visión</h2>
            <p className="mt-2">
              El sitio es compatible con VoiceOver (iPhone/Mac) y lectores similares. Usa el salto
              al contenido, headings y botones con nombre accesible. Si algo no se anuncia bien,
              avísanos para corregirlo.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Estándar de referencia</h2>
            <p className="mt-2">
              Orientamos el desarrollo a WCAG 2.2 nivel AA de forma progresiva. No afirmamos
              conformidad total: es un proceso continuo con auditorías y mejoras.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Reportar una barrera</h2>
            <p className="mt-2">
              Escríbenos a{" "}
              <a className="text-teal font-semibold underline" href="mailto:contacto@universonomada.cl">
                contacto@universonomada.cl
              </a>{" "}
              o WhatsApp{" "}
              <a
                className="text-teal font-semibold underline"
                href="https://wa.me/56974636396?text=Hola%2C%20quiero%20reportar%20un%20problema%20de%20accesibilidad"
              >
                +56 9 7463 6396
              </a>
              . Indica página, dispositivo y qué falló.
            </p>
          </div>
        </section>

        <p className="mt-12">
          <Link href="/" className="text-teal font-semibold hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
