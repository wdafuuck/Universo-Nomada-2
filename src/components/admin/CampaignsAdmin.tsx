"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Mail, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  CAMPAIGN_TEMPLATES,
  defaultCampaignContent,
  type CampaignAudience,
  type CampaignTemplateId,
} from "@/lib/email/campaign-templates-data";

type FormState = {
  templateId: CampaignTemplateId;
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  offerHighlight: string;
  offerSubline: string;
  ctaText: string;
  ctaUrl: string;
  couponCode: string;
  audience: CampaignAudience;
  testEmail: string;
};

const initialForm = (): FormState => ({
  ...defaultCampaignContent("oferta-general"),
  couponCode: "",
  audience: "all",
  testEmail: "contacto@universonomada.cl",
});

export function CampaignsAdmin() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSubject, setPreviewSubject] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  const loadCount = useCallback(async (audience: CampaignAudience) => {
    try {
      const res = await fetch(`/api/admin/campaigns/recipients?audience=${audience}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecipientCount(data.count ?? 0);
    } catch {
      setRecipientCount(null);
    }
  }, []);

  useEffect(() => {
    void loadCount(form.audience);
  }, [form.audience, loadCount]);

  const applyTemplate = (templateId: CampaignTemplateId) => {
    const defaults = defaultCampaignContent(templateId);
    setForm((f) => ({
      ...f,
      ...defaults,
      templateId,
      couponCode: f.couponCode,
      testEmail: f.testEmail,
      audience: f.audience,
    }));
    setPreviewHtml(null);
    setPreviewOpen(false);
  };

  const payload = () => ({
    templateId: form.templateId,
    subject: form.subject,
    preheader: form.preheader,
    headline: form.headline,
    body: form.body,
    offerHighlight: form.offerHighlight,
    offerSubline: form.offerSubline,
    ctaText: form.ctaText,
    ctaUrl: form.ctaUrl,
    couponCode: form.couponCode || undefined,
    audience: form.audience,
    testEmail: form.testEmail,
  });

  const preview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/admin/campaigns/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      if (!data.html) throw new Error("No se recibió la vista previa");

      setPreviewSubject(String(data.subject ?? form.subject));
      setPreviewHtml(String(data.html));
      setPreviewOpen(true);
      toast.success("Vista previa lista");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al previsualizar");
    } finally {
      setLoadingPreview(false);
    }
  };

  const send = async (testOnly: boolean) => {
    if (testOnly) {
      setSendingTest(true);
    } else {
      const count = recipientCount ?? 0;
      if (!window.confirm(`¿Enviar este anuncio a ${count} persona(s)? Esta acción no se puede deshacer.`)) {
        return;
      }
      setSendingAll(true);
    }

    try {
      const res = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload(),
          testOnly,
          confirm: !testOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");

      if (testOnly) {
        toast.success(`Correo de prueba enviado a ${form.testEmail}`);
      } else {
        toast.success(`Enviado a ${data.sent} de ${data.total} destinatarios`);
        if (data.failed > 0) {
          toast.warning(`${data.failed} correos fallaron`);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setSendingTest(false);
      setSendingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Mail className="h-5 w-5 text-teal" /> Anuncios por correo
        </h3>
        <p className="text-white/40 text-sm mt-1">
          Elige una plantilla, personaliza el mensaje y envíalo a clientes registrados o suscriptores del blog.
        </p>
      </div>

      <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
        <CardContent className="p-6 space-y-5">
          <div>
            <label className="text-white/40 text-xs font-semibold uppercase tracking-wide">Plantilla</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {CAMPAIGN_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className={`text-left rounded-xl border px-4 py-3 transition-all ${
                    form.templateId === t.id
                      ? "border-teal bg-teal/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <p className="font-bold text-sm mt-1">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs">Asunto del correo</label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs">Texto previo (preheader, inbox)</label>
              <Input value={form.preheader} onChange={(e) => setForm({ ...form, preheader: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs">Título principal</label>
              <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs">Oferta destacada (grande y negrita en el correo)</label>
              <Input value={form.offerHighlight}
                onChange={(e) => setForm({ ...form, offerHighlight: e.target.value })}
                placeholder="Ej: Atacama 5D/4N desde $890.000"
                className="mt-1 bg-white/5 border-white/10 text-white font-bold text-base" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs">Subtítulo de la oferta (opcional)</label>
              <Input value={form.offerSubline}
                onChange={(e) => setForm({ ...form, offerSubline: e.target.value })}
                placeholder="Ej: Precio por persona · Válido hasta fin de mes"
                className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs">Mensaje (párrafos separados por línea en blanco)</label>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white min-h-[140px]" />
            </div>
            <div>
              <label className="text-white/40 text-xs">Texto del botón</label>
              <Input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-white/40 text-xs">Enlace del botón</label>
              <Input value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                placeholder="/ o https://..."
                className="mt-1 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-white/40 text-xs">Código cupón (opcional)</label>
              <Input value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
                placeholder="NOMADA20"
                className="mt-1 bg-white/5 border-white/10 text-white font-mono" />
            </div>
            <div>
              <label className="text-white/40 text-xs">Enviar a</label>
              <select value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value as CampaignAudience })}
                className="mt-1 w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm">
                <option value="all">Clientes + suscriptores blog</option>
                <option value="users">Solo clientes registrados</option>
                <option value="subscribers">Solo suscriptores del blog</option>
              </select>
              {recipientCount != null && (
                <p className="text-teal text-xs mt-2 font-semibold">{recipientCount} destinatario(s)</p>
              )}
            </div>
            <div>
              <label className="text-white/40 text-xs">Email de prueba</label>
              <Input value={form.testEmail}
                onChange={(e) => setForm({ ...form, testEmail: e.target.value })}
                placeholder="contacto@universonomada.cl"
                className="mt-1 bg-white/5 border-white/10 text-white" />
              <p className="text-white/30 text-xs mt-1">Usa un buzón real del hosting (ej. contacto@…)</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <Button type="button" onClick={() => void preview()} disabled={loadingPreview}
              variant="outline" className="border-white/10 text-white bg-white/5 rounded-xl">
              <Eye className="h-4 w-4 mr-1" /> {loadingPreview ? "Generando..." : "Vista previa"}
            </Button>
            <Button type="button" onClick={() => void send(true)} disabled={sendingTest}
              variant="outline" className="border-white/10 text-white bg-white/5 rounded-xl">
              <Sparkles className="h-4 w-4 mr-1" /> {sendingTest ? "Enviando..." : "Prueba a mi email"}
            </Button>
            <Button type="button" onClick={() => void send(false)} disabled={sendingAll || !recipientCount}
              className="bg-teal text-[#070f1a] font-bold rounded-xl ml-auto">
              <Send className="h-4 w-4 mr-1" /> {sendingAll ? "Enviando..." : "Enviar a todos"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa del correo"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Vista previa del correo</h4>
                {previewSubject && (
                  <p className="text-sm text-slate-500 mt-1">
                    Asunto: <span className="font-medium text-slate-700">{previewSubject}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar vista previa"
              >
                ✕
              </button>
            </div>
            {previewHtml ? (
              <iframe
                title="Vista previa correo"
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                className="w-full flex-1 min-h-[480px] border-0 bg-slate-100"
              />
            ) : (
              <p className="p-8 text-slate-500 text-center">Cargando vista previa…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
