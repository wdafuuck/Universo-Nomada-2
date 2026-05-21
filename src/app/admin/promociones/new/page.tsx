import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PromotionForm } from "../promotion-form";

export default function NewPromotionPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/promociones"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a promociones
      </Link>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Nueva promoción</h2>
        <p className="text-sm text-slate-500 mt-1">
          La promoción aparecerá en el sitio si la marcas como activa.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <PromotionForm />
      </div>
    </div>
  );
}
