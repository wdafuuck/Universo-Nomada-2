import { Users, Tag, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";

export default async function AdminHome() {
  const [totalLeads, totalPromotions, totalDestinations] = await Promise.all([
    db.lead.count(),
    db.promotion.count({ where: { active: true } }),
    db.destination.count({ where: { active: true } }),
  ]);

  const stats = [
    { label: "Leads totales", value: totalLeads, icon: Users, color: "text-teal" },
    { label: "Promociones activas", value: totalPromotions, icon: Tag, color: "text-amber-600" },
    { label: "Destinos activos", value: totalDestinations, icon: MapPin, color: "text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Bienvenida</h2>
        <p className="text-sm text-slate-500 mt-1">
          Resumen rápido del estado de la operación.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-3xl font-black text-slate-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Siguiente fase</h3>
          <p className="text-sm text-slate-600">
            Las secciones Leads, Promociones y Destinos están en construcción.
            Aquí podrás ver y contactar leads, editar promociones, y agregar
            destinos sin tocar el código.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
