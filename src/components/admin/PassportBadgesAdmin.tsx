"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Save, Trash2, Pencil, Upload, Stamp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  emoji: "",
  matchTerms: "[]",
  active: true,
  sortOrder: 0,
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function BadgeThumb({ src, size = "sm" }: { src?: string; size?: "sm" | "lg" }) {
  const [broken, setBroken] = useState(false);
  const box =
    size === "lg"
      ? "h-28 w-28 rounded-2xl"
      : "h-14 w-14 rounded-xl";
  const icon = size === "lg" ? "h-10 w-10" : "h-6 w-6";

  return (
    <div
      className={`relative ${box} shrink-0 border border-white/15 bg-black/30 overflow-hidden flex items-center justify-center`}
    >
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <Stamp className={`${icon} text-white/30`} />
      )}
    </div>
  );
}

export function PassportBadgesAdmin() {
  const [items, setItems] = useState<Badge[]>([]);
  const [editing, setEditing] = useState<(Partial<Badge> & { id?: number }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch("/api/admin/passport-badges");
    const data = await res.json();
    setItems(data.badges ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      setEditing((e) => (e ? { ...e, image: data.url as string, emoji: "" } : e));
      toast.success("Insignia subida");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast.error("Nombre del lugar obligatorio");
      return;
    }
    if (!editing.image?.trim()) {
      toast.error("Sube la imagen de la insignia");
      return;
    }
    setSaving(true);
    try {
      const name = editing.name.trim();
      const slug = editing.slug?.trim() || slugify(name);
      const payload = {
        ...editing,
        name,
        slug,
        destination: name,
        description: (editing.description ?? "").trim(),
        image: editing.image.trim(),
        emoji: "",
        matchTerms: editing.matchTerms?.trim() || JSON.stringify([name.toLowerCase()]),
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
    const res = await fetch(`/api/admin/passport-badges/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      toast.error("Error");
      return;
    }
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
            Solo imagen de la insignia, nombre del lugar y una línea de descripción. Se desbloquean al completar un viaje a ese destino.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(empty());
            setIsNew(true);
          }}
          className="bg-teal text-[#070f1a] font-bold rounded-xl"
        >
          <Plus className="h-4 w-4 mr-1" /> Nueva
        </Button>
      </div>

      {(isNew || editing) && (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="shrink-0">
              <BadgeThumb src={editing?.image} size="lg" />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="mt-2 w-28 border-white/15 text-white bg-white/5 rounded-xl text-xs"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1" /> Subir
                  </>
                )}
              </Button>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1 block">Nombre del lugar</label>
                <Input
                  placeholder="Ej: Rapa Nui"
                  value={editing?.name ?? ""}
                  onChange={(e) => setEditing({ ...editing!, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50 mb-1 block">Descripción (una línea)</label>
                <Input
                  placeholder="Ej: Has explorado el ombligo del mundo"
                  value={editing?.description ?? ""}
                  onChange={(e) => setEditing({ ...editing!, description: e.target.value })}
                  maxLength={120}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => void save()}
              disabled={saving || uploading}
              className="bg-teal text-[#070f1a] font-bold rounded-xl"
            >
              <Save className="h-4 w-4 mr-1" /> Guardar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setIsNew(false);
              }}
              className="border-white/10 text-white bg-white/5 rounded-xl"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-3">
            <BadgeThumb src={item.image} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{item.name}</p>
              {item.description ? (
                <p className="text-white/45 text-xs mt-0.5 line-clamp-2">{item.description}</p>
              ) : null}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditing({ ...item, emoji: "" });
                  setIsNew(false);
                }}
                className="text-teal p-2"
                aria-label="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void remove(item.id)}
                className="text-red-400 p-2"
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
