"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Pencil, Upload, ImageIcon, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import { HeroCopyAdmin } from "@/components/admin/HeroCopyAdmin";
import {
  isPromoWindowActive,
  toChileDateTimeLocal,
} from "@/lib/promo-schedule";

type HeroSlide = {
  id: number;
  imageUrl: string;
  label: string;
  active: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

function scheduleLabel(slide: Pick<HeroSlide, "startsAt" | "endsAt" | "active">): string {
  if (!slide.active) return "Inactivo";
  if (!slide.startsAt && !slide.endsAt) return "Siempre (si activo)";
  if (isPromoWindowActive(slide.startsAt, slide.endsAt)) return "Visible ahora";
  const now = new Date();
  if (slide.startsAt && now < new Date(slide.startsAt)) return "Programado (aún no empieza)";
  return "Fuera de fechas";
}

export function HeroSlidesAdmin() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [editing, setEditing] = useState<(Partial<HeroSlide> & { id?: number }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/hero-slides", { credentials: "include" });
    const data = await res.json();
    setSlides(data.slides ?? []);
  };

  useEffect(() => { void load(); }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "hero");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditing((e) => (e ? { ...e, imageUrl: data.url } : e));
      toast.success("Foto subida");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing?.imageUrl) {
      toast.error("Sube una imagen primero");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        startsAt: editing.startsAt || null,
        endsAt: editing.endsAt || null,
      };
      const res = isNew
        ? await fetch("/api/admin/hero-slides", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/hero-slides/${editing.id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Error al guardar");
      }
      toast.success(isNew ? "Foto agregada al inicio" : "Foto actualizada — cierra el panel para verla en la web");
      setEditing(null);
      setIsNew(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("¿Eliminar esta foto del banner principal?")) return;
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Foto eliminada");
      if (editing?.id === id) setEditing(null);
      void load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    await fetch(`/api/admin/hero-slides/${slide.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...slide, active: !slide.active }),
    });
    void load();
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">
            {isNew ? "Nueva foto del inicio" : `Editar: ${editing.label || "Banner"}`}
          </h3>
          <Button
            variant="outline"
            onClick={() => { setEditing(null); setIsNew(false); }}
            className="bg-white/5 border-white/10 text-white"
          >
            Cancelar
          </Button>
        </div>

        <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
          <CardContent className="p-6 space-y-5">
            <div className="relative h-48 sm:h-64 w-full rounded-xl overflow-hidden bg-white/5">
              {editing.imageUrl && (
                <UploadAwareImage src={editing.imageUrl} alt="" fill className="object-cover" />
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-white/50 text-xs">Nombre (solo para ti)</label>
                <Input
                  value={editing.label ?? ""}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  placeholder="Ej: Oferta Semana Santa"
                  className="mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs">Orden</label>
                <Input
                  type="number"
                  value={editing.sortOrder ?? 0}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                  className="mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
              <p className="text-white font-semibold text-sm">Programación (opcional)</p>
              <p className="text-white/40 text-xs">
                Hora Chile. Vacío = se muestra mientras esté activo. Ideal para banners de oferta.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/50 text-xs">Desde</label>
                  <Input
                    type="datetime-local"
                    value={toChileDateTimeLocal(editing.startsAt)}
                    onChange={(e) =>
                      setEditing({ ...editing, startsAt: e.target.value || null })
                    }
                    className="mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs">Hasta (se oculta solo)</label>
                  <Input
                    type="datetime-local"
                    value={toChileDateTimeLocal(editing.endsAt)}
                    onChange={(e) =>
                      setEditing({ ...editing, endsAt: e.target.value || null })
                    }
                    className="mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={save}
              disabled={saving}
              className="w-full bg-teal text-[#070f1a] font-bold rounded-xl h-12"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar foto"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroCopyAdmin />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-teal" />
            Fotos del banner principal
          </h3>
          <p className="text-white/50 text-sm mt-1">
            {slides.length} fotos · Puedes programar inicio y término (hora Chile)
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing({
              imageUrl: "",
              label: "",
              active: true,
              sortOrder: slides.length,
              startsAt: null,
              endsAt: null,
            });
            setIsNew(true);
          }}
          className="bg-teal text-[#070f1a] font-bold rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" /> Agregar foto
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slides.map((slide) => (
          <Card
            key={slide.id}
            className={`bg-[#0f1f35] border-white/10 rounded-2xl overflow-hidden ${!slide.active ? "opacity-50" : ""}`}
          >
            <div className="relative h-36">
              <UploadAwareImage src={slide.imageUrl} alt={slide.label} fill className="object-cover" />
            </div>
            <CardContent className="p-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{slide.label || `Foto #${slide.sortOrder + 1}`}</p>
                <p className="text-white/40 text-xs">Orden {slide.sortOrder} · {scheduleLabel(slide)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleActive(slide)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50"
                  title={slide.active ? "Ocultar" : "Mostrar"}
                >
                  {slide.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(slide); setIsNew(false); }}
                  className="p-2 rounded-lg hover:bg-white/10 text-teal"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(slide.id)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {slides.length === 0 && (
        <p className="text-white/30 text-center py-12">
          No hay fotos. Agrega imágenes para el banner de inicio.
        </p>
      )}
    </div>
  );
}
