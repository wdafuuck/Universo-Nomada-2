import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-teal font-bold text-sm uppercase tracking-widest mb-2">Error 404</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
          Página no encontrada
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-8">
          El enlace no existe o ya no está disponible. Puedes volver al inicio o explorar destinos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-teal text-[#070f1a] font-bold text-sm"
          >
            Ir al inicio
          </Link>
          <Link
            href="/viajes"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl border-2 border-slate-200 text-slate-800 font-bold text-sm"
          >
            Ver destinos
          </Link>
        </div>
      </div>
    </div>
  );
}
