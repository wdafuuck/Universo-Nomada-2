"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Pencil, Upload, Gift, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadAwareImage } from "@/components/UploadAwareImage";

import { BENEFIT_RESTRICTION_TYPES } from "@/lib/benefit-constants";

type Benefit = {
  id: number;
  brandName: string;
  title: string;
  description: string;
  instructions: string;
  image: string;
  couponCode: string;
  discountLabel: string;
  restrictionType: string;
  restrictionDays: number | null;
  restrictionNote: string;
  active: boolean;
  sortOrder: number;
};

const empty = (): Omit<Benefit, "id"> => ({
  brandName: "",
  title: "",
  description: "",
  instructions: "",
  image: "",
  couponCode: "",
  discountLabel: "",
  restrictionType: "none",
  restrictionDays: null,
  restrictionNote: "",
  active: true,
  sortOrder: 0,
});

type PartnerLogo = {
  id: number;
  name: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  sortOrder: number;
};

const emptyLogo = (): Omit<PartnerLogo, "id"> => ({
  name: "",
  imageUrl: "",
  linkUrl: "",
  active: true,
  sortOrder: 0,
});

export function NomadBenefitsAdmin() {
  const [items, setItems] = useState<Benefit[]>([]);
  const [logos, setLogos] = useState<PartnerLogo[]>([]);
  const [editing, setEditing] = useState<(Partial<Benefit> & { id?: number }) | null>(null);
  const [editingLogo, setEditingLogo] = useState<(Partial<PartnerLogo> & { id?: number }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isNewLogo, setIsNewLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);

  const load = async () => {
    const [benefitsRes, logosRes] = await Promise.all([
      fetch("/api/admin/nomad-benefits"),
      fetch("/api/admin/benefit-partner-logos"),
    ]);
    const benefitsData = await benefitsRes.json();
    const logosData = await logosRes.json();
    setItems(benefitsData.benefits ?? []);
    setLogos(logosData.logos ?? []);
  };

  useEffect(() => { void load(); }, []);

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al subir");
    return data.url as string;
  };

  const save = async () => {
    if (!editing?.brandName?.trim() || !editing.title?.trim()) {
      toast.error("Marca y título son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/nomad-benefits" : `/api/admin/nomad-benefits/${editing.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      toast.success(isNew ? "Beneficio creado" : "Beneficio actualizado");
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
    if (!confirm("¿Eliminar este beneficio?")) return;
    const res = await fetch(`/api/admin/nomad-benefits/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) { toast.error("Error al eliminar"); return; }
    toast.success("Eliminado");
    await load();
  };

  const saveLogo = async () => {
    if (!editingLogo?.imageUrl?.trim()) {
      toast.error("Sube o pega la URL del logo");
      return;
    }
    setSavingLogo(true);
    try {
      const url = isNewLogo
        ? "/api/admin/benefit-partner-logos"
        : `/api/admin/benefit-partner-logos/${editingLogo.id}`;
      const res = await fetch(url, {
        method: isNewLogo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingLogo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      toast.success(isNewLogo ? "Logo agregado" : "Logo actualizado");
      setEditingLogo(null);
      setIsNewLogo(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSavingLogo(false);
    }
  };

  const removeLogo = async (id: number) => {
    if (!confirm("¿Eliminar este logo?")) return;
    const res = await fetch(`/api/admin/benefit-partner-logos/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) { toast.error("Error al eliminar"); return; }
    toast.success("Logo eliminado");
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <Gift className="h-5 w-5 text-teal" /> Beneficios Universo Nómada
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Cupones y descuentos para clientes con viaje vigente o que hayan viajado en el último año.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(empty()); setIsNew(true); }}
          className="bg-teal text-[#070f1a] font-bold rounded-xl"
        >
          <Plus className="h-4 w-4 mr-1" /> Nuevo
        </Button>
      </div>

      {(isNew || editing) && (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Marca (ej: Decathlon)" value={editing?.brandName ?? ""}
              onChange={(e) => setEditing({ ...editing!, brandName: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <Input placeholder="Título del beneficio" value={editing?.title ?? ""}
              onChange={(e) => setEditing({ ...editing!, title: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <Input placeholder="Etiqueta descuento (ej: 20% OFF)" value={editing?.discountLabel ?? ""}
              onChange={(e) => setEditing({ ...editing!, discountLabel: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <Input placeholder="Código cupón" value={editing?.couponCode ?? ""}
              onChange={(e) => setEditing({ ...editing!, couponCode: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
          </div>
          <Textarea placeholder="Descripción breve (tarjeta)" value={editing?.description ?? ""}
            onChange={(e) => setEditing({ ...editing!, description: e.target.value })}
            className="bg-white/5 border-white/10 text-white min-h-[70px]" />
          <Textarea placeholder="Instrucciones completas (cómo usar el beneficio, pasos, contacto...)" value={editing?.instructions ?? ""}
            onChange={(e) => setEditing({ ...editing!, instructions: e.target.value })}
            className="bg-white/5 border-white/10 text-white min-h-[120px]" />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs">Restricción</label>
              <select
                value={editing?.restrictionType ?? "none"}
                onChange={(e) => setEditing({ ...editing!, restrictionType: e.target.value })}
                className="mt-1 w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
              >
                {BENEFIT_RESTRICTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>
                ))}
              </select>
            </div>
            {editing?.restrictionType === "post_trip_days" && (
              <div>
                <label className="text-white/40 text-xs">Días después del viaje</label>
                <Input type="number" placeholder="30" value={editing.restrictionDays ?? ""}
                  onChange={(e) => setEditing({ ...editing, restrictionDays: Number(e.target.value) || null })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
            )}
          </div>
          {(editing?.restrictionType === "post_trip_days" || editing?.restrictionType === "upcoming_trip") && (
            <Textarea placeholder="Mensaje de restricción para el cliente (ej: solo hasta 1 mes después del viaje)"
              value={editing?.restrictionNote ?? ""}
              onChange={(e) => setEditing({ ...editing!, restrictionNote: e.target.value })}
              className="bg-white/5 border-white/10 text-white min-h-[60px]" />
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="URL imagen" value={editing?.image ?? ""}
              onChange={(e) => setEditing({ ...editing!, image: e.target.value })}
              className="flex-1 bg-white/5 border-white/10 text-white" />
            <label className="inline-flex items-center gap-2 cursor-pointer text-teal text-sm px-3 py-2 rounded-lg bg-teal/10">
              <Upload className="h-4 w-4" /> Subir
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void uploadImage(f).then((url) => setEditing({ ...editing!, image: url })).catch((err) => toast.error(err.message));
              }} />
            </label>
          </div>
          {editing?.image && (
            <div className="relative h-24 w-full max-w-xs rounded-xl overflow-hidden">
              <UploadAwareImage src={editing.image} alt="" fill className="object-cover" />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => void save()} disabled={saving} className="bg-teal text-[#070f1a] font-bold rounded-xl">
              <Save className="h-4 w-4 mr-1" /> Guardar
            </Button>
            <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}
              className="border-white/10 text-white bg-white/5 rounded-xl">Cancelar</Button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            {item.image && (
              <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0">
                <UploadAwareImage src={item.image} alt="" fill className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-teal text-xs font-bold">{item.brandName}</p>
              <p className="text-white font-semibold">{item.title}</p>
              <p className="text-white/40 text-sm truncate">{item.description}</p>
              {item.restrictionType !== "none" && (
                <p className="text-amber-400/80 text-xs mt-1">
                  Restricción: {BENEFIT_RESTRICTION_TYPES.find((t) => t.value === item.restrictionType)?.label}
                  {item.restrictionDays ? ` (${item.restrictionDays} días)` : ""}
                </p>
              )}
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

      <div className="border-t border-white/10 pt-10 mt-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-teal" /> Logos en la web (sección Beneficios)
            </h2>
            <p className="text-white/40 text-sm mt-1">
              Marcas aliadas que aparecen en la página principal, debajo del texto de beneficios exclusivos.
            </p>
          </div>
          <Button
            onClick={() => { setEditingLogo(emptyLogo()); setIsNewLogo(true); }}
            className="bg-teal text-[#070f1a] font-bold rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1" /> Logo
          </Button>
        </div>

        {(isNewLogo || editingLogo) && (
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nombre (opcional, para accesibilidad)"
                value={editingLogo?.name ?? ""}
                onChange={(e) => setEditingLogo({ ...editingLogo!, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                placeholder="Enlace web (opcional)"
                value={editingLogo?.linkUrl ?? ""}
                onChange={(e) => setEditingLogo({ ...editingLogo!, linkUrl: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="URL del logo"
                value={editingLogo?.imageUrl ?? ""}
                onChange={(e) => setEditingLogo({ ...editingLogo!, imageUrl: e.target.value })}
                className="flex-1 bg-white/5 border-white/10 text-white"
              />
              <label className="inline-flex items-center gap-2 cursor-pointer text-teal text-sm px-3 py-2 rounded-lg bg-teal/10">
                <Upload className="h-4 w-4" /> Subir
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void uploadImage(f)
                      .then((url) => setEditingLogo({ ...editingLogo!, imageUrl: url }))
                      .catch((err) => toast.error(err.message));
                  }}
                />
              </label>
            </div>
            {editingLogo?.imageUrl && (
              <div className="relative h-16 w-40 rounded-xl overflow-hidden bg-white border border-white/10">
                <UploadAwareImage src={editingLogo.imageUrl} alt="" fill className="object-contain p-2" />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={() => void saveLogo()} disabled={savingLogo} className="bg-teal text-[#070f1a] font-bold rounded-xl">
                <Save className="h-4 w-4 mr-1" /> Guardar logo
              </Button>
              <Button
                variant="outline"
                onClick={() => { setEditingLogo(null); setIsNewLogo(false); }}
                className="border-white/10 text-white bg-white/5 rounded-xl"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          {logos.map((logo) => (
            <div key={logo.id} className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 w-36">
              <div className="relative h-12 w-full rounded-lg bg-white overflow-hidden">
                <UploadAwareImage src={logo.imageUrl} alt={logo.name} fill className="object-contain p-1" />
              </div>
              <p className="text-white/50 text-xs truncate w-full text-center">{logo.name || "Sin nombre"}</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => { setEditingLogo(logo); setIsNewLogo(false); }} className="text-teal p-1">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => void removeLogo(logo.id)} className="text-red-400 p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {logos.length === 0 && (
            <p className="text-white/30 text-sm">Aún no hay logos. Sube los de tus marcas aliadas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
