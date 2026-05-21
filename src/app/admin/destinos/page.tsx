import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatCLP } from "@/lib/format";
import { DestinationActionsMenu } from "./destination-actions-menu";

export default async function DestinationsPage() {
  const destinations = await db.destination.findMany({
    orderBy: [{ active: "desc" }, { order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Destinos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Catálogo de destinos que se muestran en el sitio.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/destinos/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo destino
          </Link>
        </Button>
      </div>

      {destinations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500">Aún no hay destinos. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {destinations.map((d) => (
            <Card
              key={d.id}
              className={`rounded-2xl overflow-hidden ${d.active ? "" : "opacity-60"}`}
            >
              <div className="relative h-32 bg-slate-100">
                {d.image ? (
                  <Image
                    src={d.image}
                    alt={d.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    unoptimized={d.image.startsWith("/")}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <MapPin className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <DestinationActionsMenu id={d.id} active={d.active} />
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{d.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{d.subtitle}</p>
                  </div>
                  {!d.active && (
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300">
                      Inactivo
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Badge variant="outline" className="capitalize">
                    {d.category}
                  </Badge>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600">{d.duration}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {d.originalPrice && d.originalPrice > d.price && (
                    <span className="text-slate-400 line-through text-xs">
                      {formatCLP(d.originalPrice)}
                    </span>
                  )}
                  <span className="text-teal font-bold">{formatCLP(d.price)}</span>
                </div>

                <Button asChild size="sm" variant="outline" className="w-full mt-2">
                  <Link href={`/admin/destinos/${d.id}`}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Editar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
