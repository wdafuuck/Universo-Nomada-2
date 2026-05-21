import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DestinationForm } from "../destination-form";

export default function NewDestinationPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/destinos"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a destinos
      </Link>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Nuevo destino</h2>
        <p className="text-sm text-slate-500 mt-1">
          Se mostrará en la grilla de destinos si lo marcas como activo.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <DestinationForm />
      </div>
    </div>
  );
}
