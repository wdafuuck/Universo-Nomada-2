import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { PromotionForm } from "../promotion-form";

export default async function EditPromotionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const idNum = Number(id);
  if (Number.isNaN(idNum)) notFound();

  const promotion = await db.promotion.findUnique({ where: { id: idNum } });
  if (!promotion) notFound();

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
        <h2 className="text-2xl font-bold text-slate-900">Editar promoción</h2>
        <p className="text-sm text-slate-500 mt-1">{promotion.title}</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg px-4 py-2">
          Cambios guardados.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <PromotionForm promotion={promotion} />
      </div>
    </div>
  );
}
