import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { DestinationForm } from "../destination-form";

export default async function EditDestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const destination = await db.destination.findUnique({ where: { id } });
  if (!destination) notFound();

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
        <h2 className="text-2xl font-bold text-slate-900">Editar destino</h2>
        <p className="text-sm text-slate-500 mt-1">
          {destination.name} · <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{destination.id}</code>
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg px-4 py-2">
          Cambios guardados.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <DestinationForm destination={destination} />
      </div>
    </div>
  );
}
