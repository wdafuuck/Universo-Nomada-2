"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Save, Trash2, Pencil, Upload, Images } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Slide = {
  id: number;
  postUrl: string;
  caption: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
};

const emptySlide = (): Omit<Slide, "id"> => ({
  postUrl: "",
  caption: "",
  imageUrl: "",
  active: true,
  sortOrder: 99,
});

export function PromoSliderAdmin() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editing, setEditing] = useState<(Partial<Slide> & { id?: number }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/instagram");
    const data = await res.json();
    setSlides(data.posts ?? []);
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
      setEditing((e) => e ? { ...e, imageUrl: data.url } : e);
      toast.success("Foto subida desde tu computador");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing?.imageUrl) {
      toast.error("Sube o indica una imagen");
      return;
    }
    setSaving(true);
    try {
      const res = isNew
        ? await fetch("/api/admin/instagram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editing),
          })
        : await fetch(`/api/admin/instagram/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editing),
          });
      if (!res.ok) throw new Error();
      toast.success(isNew ? "Foto agregada al slider" : "Foto actualizada");
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
    if (!confirm("¿Eliminar esta foto del slider?")) return;
    await fetch(`/api/admin/instagram/${id}`, { method: "DELETE" });
    toast.success("Eliminada");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Images className="h-5 w-5 text-teal" /> Slider de promociones
          </h3>
          <p className="text-white/40 text-sm mt-1">
            Sube fotos de tus promos (capturas de Instagram, flyers, etc.). Aparecen en un carrusel más abajo en la home.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(emptySlide()); setIsNew(true); }}
          size="sm"
          className="bg-teal text-navy font-bold"
        >
          <Plus className="h-4 w-4 mr-1" /> Agregar foto
        </Button>
      </div>

      {editing && (
        <Card className="bg-navy-light border-white/5 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h4 className="text-white font-semibold">{isNew ? "Nueva foto" : "Editar foto"}</h4>

            <div className="relative h-48 rounded-xl overflow-hidden bg-white/5 border border-white/10">
              {editing.imageUrl ? (
                <Image src={editing.imageUrl} alt="Vista previa" fill className="object-contain" />
              ) : (
                <div className="flex items-center justify-center h-full text-white/30 text-sm">Sin imagen</div>
              )}
            </div>

            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-teal/40 text-teal font-semibold cursor-pointer hover:bg-teal/10 transition-colors">
              <Upload className="h-4 w-4" />
              {uploading ? "Subiendo..." : "Subir foto desde tu computador"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              />
            </label>

            <div>
              <label className="text-white/40 text-xs">O pegar URL de imagen</label>
              <Input
                value={editing.imageUrl ?? ""}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                placeholder="/uploads/mi-promo.jpg"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/40 text-xs">Texto sobre la foto (opcional)</label>
              <Textarea
                value={editing.caption ?? ""}
                onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                placeholder="Ej: 15% OFF Mendoza — válido hasta fin de mes"
                className="mt-1 bg-white/5 border-white/10 text-white min-h-[72px]"
              />
            </div>

            <div>
              <label className="text-white/40 text-xs">Enlace al hacer clic (opcional, ej. Instagram o WhatsApp)</label>
              <Input
                value={editing.postUrl ?? ""}
                onChange={(e) => setEditing({ ...editing, postUrl: e.target.value })}
                placeholder="https://www.instagram.com/p/..."
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={save} disabled={saving || uploading} className="bg-teal text-navy font-bold">
                <Save className="h-4 w-4 mr-1" /> {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button onClick={() => { setEditing(null); setIsNew(false); }} variant="outline" className="bg-white/5 border-white/10 text-white">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slides.map((slide) => (
          <Card key={slide.id} className="bg-navy-light border-white/5 rounded-2xl overflow-hidden">
            <div className="relative h-44">
              <Image src={slide.imageUrl || "/images/atacama-new.png"} alt={slide.caption} fill className="object-cover" />
              {!slide.active && (
                <span className="absolute top-2 left-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded-full">Oculta</span>
              )}
            </div>
            <CardContent className="p-4 space-y-2">
              <p className="text-white/70 text-sm line-clamp-2">{slide.caption || "Sin texto"}</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(slide); setIsNew(false); }}
                  className="bg-white/5 border-white/10 text-white flex-1">
                  <Pencil className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(slide.id)}
                  className="bg-red-500/10 border-red-500/20 text-red-400">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {slides.length === 0 && !editing && (
        <p className="text-white/30 text-center py-8">
          No hay fotos en el slider. Usa &quot;Agregar foto&quot; y sube imágenes desde tu PC.
        </p>
      )}
    </div>
  );
}
