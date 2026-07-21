"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BLOCKS = [
  { key: "faq", label: "FAQ (JSON)", hint: '{ "label": "...", "title": "...", "items": [{ "q": "...", "a": "..." }] }' },
  { key: "howItWorks", label: "Cómo funciona (JSON)", hint: '{ "label": "...", "title": "...", "subtitle": "...", "steps": [{ "title": "...", "desc": "..." }] }' },
] as const;

export function SiteContentAdmin() {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    BLOCKS.forEach(async ({ key }) => {
      try {
        const res = await fetch(`/api/site-content?key=${key}`, { credentials: "include" });
        const data = await res.json();
        if (data.content) {
          setDrafts((d) => ({ ...d, [key]: JSON.stringify(data.content, null, 2) }));
        }
      } catch {
        /* empty */
      }
    });
  }, []);

  const save = async (key: string) => {
    const raw = drafts[key]?.trim();
    if (!raw) {
      toast.error("Escribe JSON válido antes de guardar");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      toast.error("JSON inválido");
      return;
    }
    setSaving(key);
    try {
      const res = await fetch("/api/site-content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, content: parsed }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${key} guardado`);
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-white/50 text-sm">
        Edita el contenido público en JSON. Si un bloque está vacío, el sitio usa las traducciones por defecto.
      </p>
      {BLOCKS.map(({ key, label, hint }) => (
        <Card key={key} className="bg-[#0f1f35] border-white/10 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-teal" />
              {label}
            </CardTitle>
            <p className="text-white/40 text-xs font-mono">{hint}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={drafts[key] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
              placeholder="Pega JSON aquí o deja vacío para usar traducciones"
              className="min-h-[200px] font-mono text-sm bg-[#070f1a] border-white/10 text-white"
            />
            <Button
              onClick={() => save(key)}
              disabled={saving === key}
              className="bg-teal hover:bg-teal/90 text-[#070f1a] font-bold rounded-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving === key ? "Guardando..." : "Guardar"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
