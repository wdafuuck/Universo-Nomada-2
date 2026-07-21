"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Save, Trash2, Pencil, Upload, Stamp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Badge = {
  id: number;
  slug: string;
  name: string;
  destination: string;
  description: string;
  image: string;
  emoji: string;
  matchTerms: string;
  active: boolean;
  sortOrder: number;
};

const empty = (): Omit<Badge, "id"> => ({
  slug: "",
  name: "",
  destination: "",
  description: "",
  image: "",
  emoji: "🌍",
  matchTerms: "[]",
  active: true,
  sortOrder: 0,
});

export function PassportBadgesAdmin() {
  const [items, setItems] = useState<Badge[]>([]);
  const [editing, setEditing] = useState<(Partial<Badge> & { id?: number }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/passport-badges");
    const data = await res.json();
    setItems(data.badges ?? []);
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast.error("Nombre obligatorio");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        slug: editing.slug?.trim() || editing.name!.toLowerCase().replace(/\s+/g, "-"),
      };
      const url = isNew ? "/api/admin/passport-badges" : `/api/admin/passport-badges/${editing.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      toast.success(isNew ? "Insignia creada" : "Insignia actualizada");
      setEditing(null);
      setIsNew(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar insignia?")) return;
    const res = await fetch(`/api/admin/passport-badges/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) { toast.error("Error"); return; }
    toast.success("Eliminada");
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <Stamp className="h-5 w-5 text-teal" /> Pasaporte Nómada — Insignias
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Se desbloquean cuando el cliente completa un viaje a ese destino. Usa términos de búsqueda en JSON.
          </p>
        </div>
        <Button onClick={() => { setEditing(empty()); setIsNew(true); }} className="bg-teal text-[#070f1a] font-bold rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Nueva
        </Button>
      </div>

      {(isNew || editing) && (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Nombre (ej: Rapa Nui)" value={editing?.name ?? ""}
              onChange={(e) => setEditing({ ...editing!, name: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <Input placeholder="Slug (ej: rapa-nui)" value={editing?.slug ?? ""}
              onChange={(e) => setEditing({ ...editing!, slug: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <Input placeholder="Destino" value={editing?.destination ?? ""}
              onChange={(e) => setEditing({ ...editing!, destination: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <Input placeholder="Emoji 🗿" value={editing?.emoji ?? ""}
              onChange={(e) => setEditing({ ...editing!, emoji: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
          </div>
          <Textarea placeholder='Términos match JSON: ["rapa nui","isla de pascua"]' value={editing?.matchTerms ?? "[]"}
            onChange={(e) => setEditing({ ...editing!, matchTerms: e.target.value })}
            className="bg-white/5 border-white/10 text-white min-h-[60px] font-mono text-xs" />
          <Textarea placeholder="Descripción" value={editing?.description ?? ""}
            onChange={(e) => setEditing({ ...editing!, description: e.target.value })}
            className="bg-white/5 border-white/10 text-white min-h-[60px]" />
          <Input placeholder="URL imagen (opcional)" value={editing?.image ?? ""}
            onChange={(e) => setEditing({ ...editing!, image: e.target.value })}
            className="bg-white/5 border-white/10 text-white" />
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving} className="bg-teal text-[#070f1a] font-bold rounded-xl">
              <Save className="h-4 w-4 mr-1" /> Guardar
            </Button>
            <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}
              className="border-white/10 text-white bg-white/5 rounded-xl">Cancelar</Button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-3">
            <div className="text-3xl shrink-0">{item.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{item.name}</p>
              <p className="text-white/40 text-xs">{item.destination}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button type="button" onClick={() => { setEditing(item); setIsNew(false); }} className="text-teal p-2">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => void remove(item.id)} className="text-red-400 p-2">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
