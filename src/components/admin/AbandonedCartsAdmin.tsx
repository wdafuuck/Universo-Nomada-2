"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Row = {
  id: number;
  email: string;
  nombre: string;
  telefono: string;
  cartTotal: number;
  converted: boolean;
  reminder1At: string | null;
  reminder2At: string | null;
  createdAt: string;
  updatedAt: string;
};

export function AbandonedCartsAdmin() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/cart-abandonments", { credentials: "include" });
        const json = await res.json();
        if (!cancelled) setItems(json.items ?? []);
      } catch {
        toast.error("No se pudieron cargar carritos abandonados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="text-white/40 py-12 text-center">Cargando abandonos...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white font-bold text-lg">Carritos abandonados</h2>
        <p className="text-white/50 text-sm">Solo panel admin — no afecta la web pública.</p>
      </div>
      {items.length === 0 ? (
        <p className="text-white/40 text-sm">Sin registros.</p>
      ) : (
        <div className="space-y-2">
          {items.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-white/10 bg-[#0f1f35] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <p className="text-white font-semibold text-sm">
                  {row.nombre || "Sin nombre"} · {row.email}
                </p>
                <p className="text-white/50 text-xs">
                  Total ${row.cartTotal.toLocaleString("es-CL")} ·{" "}
                  {row.converted ? "Convertido" : "Pendiente"} ·{" "}
                  {new Date(row.updatedAt).toLocaleString("es-CL")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  void navigator.clipboard.writeText(row.email);
                  toast.success("Email copiado");
                }}
              >
                Copiar email
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
