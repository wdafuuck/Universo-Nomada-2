"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Save, Trash2, Pencil, Upload, BookOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import { adminRowToForm, estimateReadTime, slugifyTitle, type BlogArticleRow } from "@/lib/blog-utils";

type ArticleForm = {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  date: string;
  readTime: number;
  active: boolean;
};

type ArticleRow = BlogArticleRow;

const emptyForm = (): ArticleForm => ({
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "Experiencias",
  image: "/images/atacama-new.png",
  date: new Date().toISOString().slice(0, 10),
  readTime: 5,
  active: true,
});

function titleFromJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { es?: string };
    return parsed.es ?? "Sin título";
  } catch {
    return "Sin título";
  }
}

export function BlogAdmin() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [editing, setEditing] = useState<ArticleForm | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/blog", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setArticles(data.articles ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando blog");
    }
  };

  useEffect(() => { void load(); }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
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

  const openNew = () => {
    setEditing(emptyForm());
    setIsNew(true);
  };

  const openEdit = (row: ArticleRow) => {
    setEditing(adminRowToForm(row));
    setIsNew(false);
  };

  const save = async () => {
    if (!editing?.title.trim()) {
      toast.error("Título obligatorio");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editing,
        slug: editing.slug.trim() || slugifyTitle(editing.title),
        readTime: editing.readTime || estimateReadTime(editing.content),
      };
      const url = isNew ? "/api/admin/blog" : `/api/admin/blog/${editing.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      toast.success(isNew ? "Artículo creado" : "Artículo actualizado");
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
    if (!window.confirm("¿Eliminar este artículo del blog?")) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
      toast.success("Artículo eliminado");
      if (editing?.id === id) setEditing(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-white font-bold text-lg">{isNew ? "Nuevo artículo" : "Editar artículo"}</h3>
          <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}
            className="bg-white/5 border-white/10 text-white rounded-xl">Cancelar</Button>
        </div>

        <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-white/40 text-xs">Título</label>
                <Input value={editing.title}
                  onChange={(e) => setEditing({
                    ...editing,
                    title: e.target.value,
                    slug: isNew && !editing.slug ? slugifyTitle(e.target.value) : editing.slug,
                    readTime: estimateReadTime(e.target.value + "\n" + editing.content),
                  })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/40 text-xs">Slug (URL)</label>
                <Input value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: slugifyTitle(e.target.value) || e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white font-mono text-sm" />
              </div>
              <div>
                <label className="text-white/40 text-xs">Categoría</label>
                <Input value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/40 text-xs">Fecha</label>
                <Input type="date" value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/40 text-xs">Tiempo de lectura (min)</label>
                <Input type="number" min={1} value={editing.readTime}
                  onChange={(e) => setEditing({ ...editing, readTime: Number(e.target.value) || 5 })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-white/40 text-xs">Extracto</label>
                <Textarea value={editing.excerpt}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white min-h-[80px]" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-white/40 text-xs">Contenido (párrafos separados por línea en blanco)</label>
                <Textarea value={editing.content}
                  onChange={(e) => setEditing({
                    ...editing,
                    content: e.target.value,
                    readTime: estimateReadTime(e.target.value),
                  })}
                  className="mt-1 bg-white/5 border-white/10 text-white min-h-[220px]" />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <label className="text-white/40 text-xs">Imagen destacada</label>
              <div className="mt-2 flex flex-wrap items-start gap-4">
                {editing.image && (
                  <div className="relative h-28 w-44 rounded-xl overflow-hidden border border-white/10">
                    <UploadAwareImage src={editing.image} alt="" fill className="object-cover" />
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir imagen"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f); }} />
                </label>
                <Input value={editing.image}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="/images/..."
                  className="flex-1 min-w-[200px] bg-white/5 border-white/10 text-white text-sm" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input type="checkbox" checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="rounded border-white/20" />
              Publicado (visible en el sitio)
            </label>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => void save()} disabled={saving}
                className="bg-teal text-[#070f1a] font-bold rounded-xl">
                <Save className="h-4 w-4 mr-1" /> {saving ? "Guardando..." : "Guardar"}
              </Button>
              {!isNew && editing.id && (
                <>
                  <Button variant="outline" asChild className="border-white/10 text-white bg-white/5 rounded-xl">
                    <Link href={`/blog/${editing.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" /> Ver en sitio
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => void remove(editing.id!)}
                    className="border-red-500/30 text-red-400 bg-red-500/10 rounded-xl ml-auto">
                    <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal" /> Blog ({articles.length})
          </h3>
          <p className="text-white/40 text-sm mt-1">Crea, edita y elimina artículos del blog público.</p>
        </div>
        <Button onClick={openNew} className="bg-teal text-[#070f1a] font-bold rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> Nuevo artículo
        </Button>
      </div>

      <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Artículo", "Fecha", "Lectura", "Estado", ""].map((h) => (
                    <th key={h} className="text-left text-white/50 font-semibold px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {article.image && (
                          <div className="relative h-12 w-16 rounded-lg overflow-hidden shrink-0 border border-white/10">
                            <UploadAwareImage src={article.image} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{titleFromJson(article.titleJson)}</p>
                          <p className="text-white/40 text-xs font-mono">/blog/{article.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60 whitespace-nowrap">{article.date}</td>
                    <td className="px-4 py-3 text-white/60">{article.readTime} min</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        article.active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"
                      }`}>
                        {article.active ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button type="button" onClick={() => openEdit(article)}
                          className="text-teal hover:text-teal/80 p-1" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => void remove(article.id)}
                          className="text-red-400 hover:text-red-300 p-1" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {articles.length === 0 && (
              <p className="text-white/40 text-center py-10">No hay artículos. Crea el primero.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
