"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Pencil, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UploadAwareImage } from "@/components/UploadAwareImage";

type Promo = {
  id: number;
  title: string;
  subtitle: string;
  discount: string;
  destination: string;
  validUntil: string;
  originalPrice: number;
  discountPrice: number;
  emoji: string;
  image: string;
  active: boolean;
};

const emptyPromo = (): Omit<Promo, "id"> => ({
  title: "",
  subtitle: "",
  discount: "15% OFF",
  destination: "",
  validUntil: "",
  originalPrice: 0,
  discountPrice: 0,
  emoji: "🔥",
  image: "/images/atacama-new.png",
  active: true,
});

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

export function PromotionsAdmin() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [editing, setEditing] = useState<(Partial<Promo> & { id?: number }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/promotions");
    const data = await res.json();
    setPromos(data.promotions ?? []);
  };

  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditing((e) => e ? { ...e, image: data.url } : e);
      toast.success("Imagen subida");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const applyDiscount = (percent: number) => {
    if (!editing?.originalPrice) return;
    setEditing({
      ...editing,
      discountPrice: Math.round(editing.originalPrice * (1 - percent / 100)),
      discount: `${percent}% OFF`,
    });
  };

  const save = async () => {
    if (!editing?.title) { toast.error("Título obligatorio"); return; }
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/promotions" : `/api/admin/promotions/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error();
      toast.success(isNew ? "Promoción creada" : "Promoción actualizada");
      setEditing(null);
      setIsNew(false);
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    toast.success("Eliminada");
    setEditing(null);
    load();
  };

  const toggleActive = async (promo: Promo) => {
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...promo, active: !promo.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(promo.active ? "Promoción ocultada en la web" : "Promoción visible en la web");
      load();
    } catch {
      toast.error("No se pudo cambiar la visibilidad");
    }
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{isNew ? "Nueva promoción" : "Editar promoción"}</h3>
          <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}
            className="bg-white/5 border-white/10 text-white">Cancelar</Button>
        </div>
        <Card className="bg-navy-light border-white/5 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="relative h-32 rounded-xl overflow-hidden">
              {editing.image && <UploadAwareImage src={editing.image} alt="" fill className="object-cover" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-white/40 text-xs">Título *</label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" /></div>
              <div><label className="text-white/40 text-xs">Subtítulo</label>
                <Input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" /></div>
              <div><label className="text-white/40 text-xs">Destino</label>
                <Input value={editing.destination ?? ""} onChange={(e) => setEditing({ ...editing, destination: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" /></div>
              <div><label className="text-white/40 text-xs">Badge descuento</label>
                <Input value={editing.discount ?? ""} onChange={(e) => setEditing({ ...editing, discount: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" /></div>
              <div><label className="text-white/40 text-xs">Válido hasta</label>
                <Input value={editing.validUntil ?? ""} onChange={(e) => setEditing({ ...editing, validUntil: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" /></div>
              <div><label className="text-white/40 text-xs">Emoji</label>
                <Input value={editing.emoji ?? ""} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" /></div>
              <div><label className="text-white/40 text-xs">Precio original</label>
                <Input type="number" value={editing.originalPrice ?? 0}
                  onChange={(e) => setEditing({ ...editing, originalPrice: Number(e.target.value) })}
                  className="mt-1 bg-white/5 border-white/10 text-white" /></div>
              <div><label className="text-white/40 text-xs">Precio con descuento</label>
                <Input type="number" value={editing.discountPrice ?? 0}
                  onChange={(e) => setEditing({ ...editing, discountPrice: Number(e.target.value) })}
                  className="mt-1 bg-white/5 border-white/10 text-white" /></div>
              <div className="sm:col-span-2">
                <label className="text-white/40 text-xs">Imagen</label>
                <Input value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
                <label className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-teal/40 text-teal text-sm font-semibold cursor-pointer hover:bg-teal/10">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir desde tu computador"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </label>
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.active !== false}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4 rounded border-white/20"
              />
              <span className="text-white text-sm font-medium">Visible en la web (sección Ofertas)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 15, 20, 25, 30].map((p) => (
                <button key={p} type="button" onClick={() => applyDiscount(p)}
                  className="px-3 py-1 rounded-lg bg-amber/20 text-amber text-xs font-bold">-{p}%</button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={save} disabled={saving} className="bg-teal text-navy font-bold flex-1">
                <Save className="h-4 w-4 mr-2" /> Guardar
              </Button>
              {!isNew && editing.id && (
                <Button onClick={() => remove(editing.id!)} variant="outline" className="border-red-500/50 text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visibleCount = promos.filter((p) => p.active).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-white/50 text-sm">
          {promos.length} promociones · {visibleCount} visibles en la web
        </p>
        <Button onClick={() => { setEditing(emptyPromo()); setIsNew(true); }} className="bg-teal text-navy font-bold">
          <Plus className="h-4 w-4 mr-2" /> Nueva promoción
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((p) => (
          <Card key={p.id} className={`bg-navy-light border-white/5 rounded-2xl overflow-hidden ${!p.active ? "opacity-50" : ""}`}>
            <div className="relative h-28">
              <UploadAwareImage src={p.image || "/images/atacama-new.png"} alt={p.title} fill className="object-cover" />
              <span className="absolute top-2 right-2 bg-coral text-white text-xs font-bold px-2 py-0.5 rounded-full">{p.discount}</span>
              {!p.active && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Oculta</span>
              )}
            </div>
            <CardContent className="p-4">
              <h4 className="text-white font-bold">{p.emoji} {p.title}</h4>
              <p className="text-white/50 text-sm">{p.subtitle}</p>
              <div className="flex gap-2 mt-2 text-sm">
                <span className="text-white/30 line-through">{formatCLP(p.originalPrice)}</span>
                <span className="text-teal font-bold">{formatCLP(p.discountPrice)}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => { setEditing({ ...p }); setIsNew(false); }}
                  className="flex-1 bg-white/10 text-white"><Pencil className="h-3.5 w-3.5 mr-1" /> Editar</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(p)}
                  className="border-white/20 text-white/70 hover:bg-white/10"
                  title={p.active ? "Ocultar en la web" : "Mostrar en la web"}
                >
                  {p.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(p.id)}
                  className="border-red-500/30 text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
