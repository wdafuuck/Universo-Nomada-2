"use client";

import { useEffect, useState } from "react";
import { Save, Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toChileDateTimeLocal } from "@/lib/promo-schedule";
import {
  DEFAULT_HERO_COPY_ES,
  isHeroCopyHidden,
  type HeroSiteContent,
} from "@/lib/hero-site-content";

export function HeroCopyAdmin() {
  const [form, setForm] = useState<HeroSiteContent>({
    line1: DEFAULT_HERO_COPY_ES.line1,
    line2: DEFAULT_HERO_COPY_ES.line2,
    subtitle: DEFAULT_HERO_COPY_ES.subtitle,
    hideCopy: false,
    hideCopyStartsAt: null,
    hideCopyEndsAt: null,
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-content?key=hero", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const c = (data.content ?? {}) as HeroSiteContent;
        setForm({
          line1: c.line1?.trim() || DEFAULT_HERO_COPY_ES.line1,
          line2: c.line2 !== undefined ? c.line2 : DEFAULT_HERO_COPY_ES.line2,
          subtitle: c.subtitle?.trim() || DEFAULT_HERO_COPY_ES.subtitle,
          hideCopy: Boolean(c.hideCopy),
          hideCopyStartsAt: c.hideCopyStartsAt ?? null,
          hideCopyEndsAt: c.hideCopyEndsAt ?? null,
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload: HeroSiteContent = {
        line1: (form.line1 ?? "").trim() || DEFAULT_HERO_COPY_ES.line1,
        line2: (form.line2 ?? "").trim(),
        subtitle: (form.subtitle ?? "").trim(),
        hideCopy: Boolean(form.hideCopy),
        hideCopyStartsAt: form.hideCopy ? form.hideCopyStartsAt || null : null,
        hideCopyEndsAt: form.hideCopy ? form.hideCopyEndsAt || null : null,
      };
      if (
        payload.hideCopy &&
        payload.hideCopyStartsAt &&
        payload.hideCopyEndsAt &&
        new Date(payload.hideCopyStartsAt) >= new Date(payload.hideCopyEndsAt)
      ) {
        toast.error("La fecha de inicio debe ser anterior al término");
        return;
      }
      const res = await fetch("/api/site-content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero", content: payload }),
      });
      if (!res.ok) throw new Error();
      setForm(payload);
      toast.success(
        payload.hideCopy
          ? "Texto guardado · título oculto en la web (foto con mensaje)"
          : "Texto del inicio guardado",
      );
    } catch {
      toast.error("No se pudo guardar el texto");
    } finally {
      setSaving(false);
    }
  };

  const hiddenNow = isHeroCopyHidden(form);

  return (
    <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Type className="h-5 w-5 text-teal" />
            Texto del inicio
          </h3>
          <p className="text-white/40 text-sm mt-1">
            Título y subtítulo sobre el banner. Si subes una foto que ya trae el mensaje (oferta, descuento),
            ocúltalo por un tiempo para que no se superponga.
          </p>
        </div>

        {!loaded ? (
          <p className="text-white/30 text-sm">Cargando…</p>
        ) : (
          <>
            <div className="grid gap-3">
              <div>
                <label className="text-white/50 text-xs">Título línea 1</label>
                <Input
                  value={form.line1 ?? ""}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                  placeholder={DEFAULT_HERO_COPY_ES.line1}
                />
              </div>
              <div>
                <label className="text-white/50 text-xs">Título línea 2 (opcional)</label>
                <Input
                  value={form.line2 ?? ""}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                  placeholder={DEFAULT_HERO_COPY_ES.line2}
                />
              </div>
              <div>
                <label className="text-white/50 text-xs">Subtítulo</label>
                <Textarea
                  value={form.subtitle ?? ""}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="mt-1 min-h-[72px] bg-white/5 border-white/10 text-white rounded-xl"
                  placeholder={DEFAULT_HERO_COPY_ES.subtitle}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.hideCopy)}
                  onChange={(e) => setForm({ ...form, hideCopy: e.target.checked })}
                  className="mt-1 rounded border-white/20"
                />
                <span>
                  <span className="text-white font-semibold text-sm block">
                    Ocultar título y subtítulo
                  </span>
                  <span className="text-white/40 text-xs">
                    Ideal cuando la foto ya tiene el texto (promo, % OFF). Los botones Ver paquetes / Cotizar siguen visibles.
                    El fondo se aclara un poco para no tapar el mensaje de la imagen.
                  </span>
                </span>
              </label>

              {form.hideCopy && (
                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-white/50 text-xs">Ocultar desde (hora Chile)</label>
                    <Input
                      type="datetime-local"
                      value={toChileDateTimeLocal(form.hideCopyStartsAt)}
                      onChange={(e) =>
                        setForm({ ...form, hideCopyStartsAt: e.target.value || null })
                      }
                      className="mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs">Mostrar de nuevo desde (término)</label>
                    <Input
                      type="datetime-local"
                      value={toChileDateTimeLocal(form.hideCopyEndsAt)}
                      onChange={(e) =>
                        setForm({ ...form, hideCopyEndsAt: e.target.value || null })
                      }
                      className="mt-1 bg-white/5 border-white/10 text-white rounded-xl"
                    />
                  </div>
                  <p className="sm:col-span-2 text-xs text-white/40">
                    Sin fechas = oculto hasta que desactives la casilla.
                    {hiddenNow
                      ? " · Ahora mismo el texto está oculto en la web."
                      : " · Ahora mismo el texto se muestra (fuera de la ventana o aún no empieza)."}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => void save()}
              disabled={saving}
              className="bg-teal text-[#070f1a] font-bold rounded-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando…" : "Guardar texto del inicio"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
