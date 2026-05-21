import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatCLP, formatDate } from "@/lib/format";
import { PromotionActionsMenu } from "./promotion-actions-menu";

export default async function PromotionsPage() {
  const promotions = await db.promotion.findMany({
    orderBy: [{ active: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Promociones</h2>
          <p className="text-sm text-slate-500 mt-1">
            Ofertas destacadas que se muestran en el sitio.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/promociones/new">
            <Plus className="h-4 w-4 mr-2" />
            Nueva promoción
          </Link>
        </Button>
      </div>

      {promotions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500">Aún no hay promociones. Crea la primera.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {promotions.map((p) => (
            <Card
              key={p.id}
              className={`rounded-2xl overflow-hidden ${
                p.active ? "" : "opacity-60"
              }`}
            >
              <div className="relative h-32 bg-slate-100">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    unoptimized={p.image.startsWith("/")}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">
                    {p.emoji}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <PromotionActionsMenu id={p.id} active={p.active} />
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">
                      {p.emoji} {p.title}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">{p.subtitle}</p>
                  </div>
                  {!p.active && (
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300">
                      Inactiva
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-coral text-white border-transparent">
                    {p.discount}
                  </Badge>
                  <span className="text-slate-400 line-through text-xs">
                    {formatCLP(p.originalPrice)}
                  </span>
                  <span className="text-teal font-bold">
                    {formatCLP(p.discountPrice)}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Válida hasta {formatDate(p.validUntil)} · Orden {p.order}
                </p>

                <Button asChild size="sm" variant="outline" className="w-full mt-2">
                  <Link href={`/admin/promociones/${p.id}`}>
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
