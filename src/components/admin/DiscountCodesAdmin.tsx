"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Pencil, Ticket, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDiscountLabel } from "@/lib/discount-codes";

type DiscountCode = {
  id: number;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  active: boolean;
  validUntil: string | null;
};

type Editing = Partial<DiscountCode> & { id?: number; validUntilDate?: string };

const empty = (): Omit<DiscountCode, "id"> & { validUntilDate: string } => ({
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  active: true,
  validUntil: null,
  validUntilDate: "",
});

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function DiscountCodesAdmin() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/discount-codes", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error al cargar códigos");
      return;
    }
    setCodes(data.codes ?? []);
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!editing?.code?.trim()) {
      toast.error("El código es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/discount-codes" : `/api/admin/discount-codes/${editing.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: editing.code,
          description: editing.description ?? "",
          discountType: editing.discountType ?? "percent",
          discountValue: editing.discountValue ?? 0,
          active: editing.active !== false,
          validUntil: editing.validUntilDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      toast.success(isNew ? "Código creado" : "Código actualizado");
      setEditing(null);
      setIsNew(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: number, active: boolean) => {
    const res = await fetch(`/api/admin/discount-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active }),
    });
    if (!res.ok) {
      toast.error("Error al cambiar estado");
      return;
    }
    toast.success(active ? "Código activado" : "Código desactivado");
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar este código de descuento?")) return;
    const res = await fetch(`/api/admin/discount-codes/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Código eliminado");
    await load();
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{isNew ? "Nuevo código" : "Editar código"}</h3>
          <Button
            variant="outline"
            onClick={() => { setEditing(null); setIsNew(false); }}
            className="bg-white/5 border-white/10 text-white"
          >
            Cancelar
          </Button>
        </div>

        <Card className="bg-navy-light border-white/5 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-white/40 text-xs">Código (lo escribe el cliente)</label>
              <Input
                value={editing.code ?? ""}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                placeholder="VERANO2026"
                className="mt-1 bg-white/5 border-white/10 text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-white/40 text-xs">Descripción interna (opcional)</label>
              <Input
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Campaña Instagram marzo"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/40 text-xs">Tipo de descuento</label>
                <select
                  value={editing.discountType ?? "percent"}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      discountType: e.target.value as "percent" | "fixed",
                    })
                  }
                  className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm"
                >
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (CLP)</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs">
                  {editing.discountType === "fixed" ? "Monto en CLP" : "Porcentaje"}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={editing.discountType === "percent" ? 100 : undefined}
                  value={editing.discountValue ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, discountValue: Number(e.target.value) || 0 })
                  }
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-white/40 text-xs">Válido hasta (opcional)</label>
              <Input
                type="date"
                value={editing.validUntilDate ?? ""}
                onChange={(e) => setEditing({ ...editing, validUntilDate: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>

            <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editing.active !== false}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="rounded"
              />
              Código activo
            </label>

            <Button onClick={() => void save()} disabled={saving} className="w-full bg-teal text-[#070f1a] font-bold">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar código"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-teal" />
            Códigos de descuento
          </h3>
          <p className="text-white/40 text-sm mt-1">
            Los clientes los ingresan al pagar en el carrito. Activa o desactiva sin borrar.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(empty()); setIsNew(true); }}
          className="bg-teal text-[#070f1a] font-bold shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" /> Nuevo código
        </Button>
      </div>

      {codes.length === 0 ? (
        <Card className="bg-navy-light border-white/5 rounded-2xl">
          <CardContent className="p-8 text-center text-white/40">
            No hay códigos creados. Crea el primero con el botón de arriba.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {codes.map((row) => (
            <Card key={row.id} className="bg-navy-light border-white/5 rounded-2xl overflow-hidden">
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-mono font-bold text-white text-lg">{row.code}</p>
                  <p className="text-teal text-sm font-semibold mt-0.5">
                    {formatDiscountLabel(row.discountType, row.discountValue)} de descuento
                  </p>
                  {row.description && (
                    <p className="text-white/40 text-xs mt-1">{row.description}</p>
                  )}
                  {row.validUntil && (
                    <p className="text-white/30 text-xs mt-1">
                      Vence: {new Date(row.validUntil).toLocaleDateString("es-CL")}
                    </p>
                  )}
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    row.active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"
                  }`}
                >
                  {row.active ? "Activo" : "Inactivo"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(row.id, !row.active)}
                    className="text-white/60 hover:text-teal p-2"
                    title={row.active ? "Desactivar" : "Activar"}
                  >
                    {row.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...row,
                        validUntilDate: toDateInput(row.validUntil),
                      })
                    }
                    className="text-white/60 hover:text-white p-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
