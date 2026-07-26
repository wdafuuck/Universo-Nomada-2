"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3, Bot, ExternalLink, Loader2, Send, Sparkles, Target, TrendingDown, TrendingUp, Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/contexts/AdminThemeContext";
import { cn } from "@/lib/utils";

type Overview = {
  periodDays: number;
  leadsTotal: number;
  leadsPeriod: number;
  leadsPrevPeriod: number;
  leadsChangePct: number | null;
  checkoutsPeriod: number;
  byDestination: { name: string; count: number }[];
  bySource: { name: string; count: number }[];
  activeTours: number;
  activeBlogPosts: number;
  activePromos: number;
  recommendations: string[];
  geminiConfigured: boolean;
  ga4PropertyId: string | null;
  siteUrl: string;
  sharedNote: string;
};

type ChatMsg = { role: "user" | "assistant"; text: string; provider?: string };

const QUICK = [
  "¿Dónde debemos atacar esta semana para más tráfico y cotizaciones?",
  "Analiza la competencia y dime qué están haciendo mejor que nosotros",
  "Plan SEO 7 días para Rapa Nui / Tapati y Atacama",
  "Qué mejorar en móvil y conversión (WhatsApp + cotizar)",
];

export function TrafficSeoAdmin() {
  const { isLight } = useAdminTheme();
  const [days, setDays] = useState(28);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [competitorInput, setCompetitorInput] = useState(
    "https://www.destinos.cl\nhttps://www.chile.travel",
  );
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Hola Ricardo y Rocío 👋 Soy el asistente SEO de Universo Nómada. Puedo leer métricas del negocio, analizar URLs de competencia y decirles dónde atacar. Escriban una pregunta o usen un atajo.",
    },
  ]);
  const [sending, setSending] = useState(false);

  const card = isLight ? "bg-white border-slate-200" : "bg-[#0f1f35] border-white/10";
  const muted = isLight ? "text-slate-500" : "text-white/50";
  const title = isLight ? "text-slate-900" : "text-white";

  const parseJsonSafe = async (res: Response): Promise<Record<string, unknown>> => {
    const raw = await res.text();
    if (!raw.trim()) {
      throw new Error(
        res.status === 502 || res.status === 503
          ? "El servidor se estaba reiniciando. Espera 10 s y reintenta."
          : `Respuesta vacía del servidor (HTTP ${res.status}).`,
      );
    }
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`Respuesta no válida del servidor (HTTP ${res.status}).`);
    }
  };

  const load = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/overview?days=${d}`, { credentials: "include" });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(String(data.error || "Error"));
      setOverview(data as unknown as Overview);
    } catch {
      toast.error("No se pudieron cargar las métricas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const send = async (text?: string) => {
    const msg = (text ?? message).trim();
    if (!msg || sending) return;
    setMessage("");
    setChat((c) => [...c, { role: "user", text: msg }]);
    setSending(true);
    try {
      const fromBox = competitorInput
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const fromMsg = (msg.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? []).map((u) => u.trim());
      const competitorUrls = [...new Set([...fromMsg, ...fromBox])].slice(0, 3);

      const res = await fetch("/api/admin/seo/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, competitorUrls, days }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(String(data.error || "Error"));
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: String(data.reply ?? ""),
          provider: typeof data.provider === "string" ? data.provider : undefined,
        },
      ]);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Error del asistente";
      toast.error(errMsg);
      setChat((c) => [
        ...c,
        { role: "assistant", text: `No pude responder ahora. ${errMsg}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const change = overview?.leadsChangePct;
  const up = change !== null && change !== undefined && change >= 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className={cn("text-2xl font-black tracking-tight", title)}>Tráfico & SEO</h2>
          <p className={cn("text-sm mt-1", muted)}>
            {overview?.sharedNote ?? "Vista compartida del negocio (Ricardo + Rocío)."}
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 28, 90].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              className={days === d ? "bg-teal text-navy" : ""}
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {loading || !overview ? (
        <div className={cn("rounded-2xl border p-12 flex justify-center", card)}>
          <Loader2 className="h-6 w-6 animate-spin text-teal" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric
              card={card}
              title={title}
              muted={muted}
              label={`Cotizaciones (${overview.periodDays}d)`}
              value={String(overview.leadsPeriod)}
              hint={`Antes: ${overview.leadsPrevPeriod}`}
              icon={<Users className="h-4 w-4 text-teal" />}
              delta={change}
              up={up}
            />
            <Metric
              card={card}
              title={title}
              muted={muted}
              label="Checkouts / carrito"
              value={String(overview.checkoutsPeriod)}
              hint="Con método de pago o total"
              icon={<BarChart3 className="h-4 w-4 text-amber-400" />}
            />
            <Metric
              card={card}
              title={title}
              muted={muted}
              label="Leads históricos"
              value={String(overview.leadsTotal)}
              hint="Toda la base"
              icon={<Target className="h-4 w-4 text-sky-400" />}
            />
            <Metric
              card={card}
              title={title}
              muted={muted}
              label="Catálogo activo"
              value={`${overview.activeTours} tours`}
              hint={`${overview.activeBlogPosts} blog · ${overview.activePromos} en ofertas`}
              icon={<Sparkles className="h-4 w-4 text-violet-400" />}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className={cn("rounded-2xl border p-5", card)}>
              <h3 className={cn("font-bold mb-3", title)}>Destinos más pedidos</h3>
              {overview.byDestination.length === 0 ? (
                <p className={cn("text-sm", muted)}>Sin datos en el periodo.</p>
              ) : (
                <ul className="space-y-2">
                  {overview.byDestination.map((d) => (
                    <li key={d.name} className="flex justify-between text-sm gap-2">
                      <span className={title}>{d.name}</span>
                      <span className={cn("font-bold tabular-nums", muted)}>{d.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={cn("rounded-2xl border p-5", card)}>
              <h3 className={cn("font-bold mb-3", title)}>Fuentes de leads</h3>
              {overview.bySource.length === 0 ? (
                <p className={cn("text-sm", muted)}>Sin datos en el periodo.</p>
              ) : (
                <ul className="space-y-2">
                  {overview.bySource.map((s) => (
                    <li key={s.name} className="flex justify-between text-sm gap-2">
                      <span className={title}>{s.name}</span>
                      <span className={cn("font-bold tabular-nums", muted)}>{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={cn("rounded-2xl border p-5", card)}>
            <h3 className={cn("font-bold mb-1 flex items-center gap-2", title)}>
              <Target className="h-4 w-4 text-teal" /> Checklist conexiones (4 pasos)
            </h3>
            <p className={cn("text-xs mb-4", muted)}>
              Ricardo y Rocío: completar una vez. Luego ambos ven lo mismo.
            </p>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-teal/20 text-teal text-xs font-black flex items-center justify-center">
                  1
                </span>
                <div>
                  <p className={cn("font-semibold", title)}>Vincular Search Console ↔ GA4</p>
                  <p className={cn("text-xs mt-0.5 leading-relaxed", muted)}>
                    En Analytics: Admin (engranaje) → Vínculos de productos → Search Console → Vincular →
                    elegir la propiedad <span className="font-mono">universonomada.cl</span>.
                  </p>
                  <a
                    href="https://analytics.google.com/analytics/web/#/a/admin/product-link/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal text-xs mt-1.5 hover:underline"
                  >
                    Abrir vínculos Search Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-teal/20 text-teal text-xs font-black flex items-center justify-center">
                  2
                </span>
                <div>
                  <p className={cn("font-semibold", title)}>Etiqueta GA4 dentro de GTM</p>
                  <p className={cn("text-xs mt-0.5 leading-relaxed", muted)}>
                    Contenedor <span className="font-mono">GTM-N9BH38RF</span>: Etiquetas → Nueva →
                    Configuración de Google Analytics: GA4 → ID de medición (G-…) → Activación: All Pages →
                    Enviar. Hoy el sitio ya manda GA directo tras cookies; GTM debe tener la misma etiqueta
                    para Ads y eventos futuros.
                  </p>
                  <a
                    href="https://tagmanager.google.com/#/container/accounts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal text-xs mt-1.5 hover:underline"
                  >
                    Abrir Tag Manager <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-teal/20 text-teal text-xs font-black flex items-center justify-center">
                  3
                </span>
                <div>
                  <p className={cn("font-semibold", title)}>Probar Tiempo real</p>
                  <p className={cn("text-xs mt-0.5 leading-relaxed", muted)}>
                    Ventana de incógnito →{" "}
                    <a href="https://universonomada.cl/" className="text-teal hover:underline">
                      universonomada.cl
                    </a>{" "}
                    → Aceptar todas → en GA: Informes → Tiempo real. Debes aparecer vos (1 usuario).
                  </p>
                  <a
                    href="https://analytics.google.com/analytics/web/#/p/realtime/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal text-xs mt-1.5 hover:underline"
                  >
                    Abrir Tiempo real <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-teal/20 text-teal text-xs font-black flex items-center justify-center">
                  4
                </span>
                <div>
                  <p className={cn("font-semibold", title)}>Acceso cruzado Ricardo ↔ Rocío</p>
                  <p className={cn("text-xs mt-0.5 leading-relaxed", muted)}>
                    En GA, GTM y Search Console: añadir el correo del otro como{" "}
                    <strong className={title}>Editor</strong> (o Administrador). Misma cuenta de negocio,
                    dos personas.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <a
                      href="https://analytics.google.com/analytics/web/#/a/admin/account/users"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal text-xs hover:underline"
                    >
                      Usuarios GA <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href="https://tagmanager.google.com/#/admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal text-xs hover:underline"
                    >
                      Usuarios GTM <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href="https://search.google.com/search-console/users"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal text-xs hover:underline"
                    >
                      Usuarios Search Console <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <div className={cn("rounded-2xl border p-5", card)}>
            <h3 className={cn("font-bold mb-3 flex items-center gap-2", title)}>
              <Target className="h-4 w-4 text-teal" /> Dónde atacar (auto)
            </h3>
            <ul className="space-y-2">
              {overview.recommendations.map((r) => (
                <li key={r} className={cn("text-sm leading-relaxed pl-3 border-l-2 border-teal/40", muted)}>
                  <span className={title}>{r}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal hover:underline"
              >
                Abrir Google Analytics <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal hover:underline"
              >
                Search Console <ExternalLink className="h-3 w-3" />
              </a>
              <span className={muted}>
                IA: {overview.geminiConfigured ? "Gemini activo (gratis)" : "modo reglas — añade GEMINI_API_KEY"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Chat SEO */}
      <div className={cn("rounded-2xl border overflow-hidden", card)}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", isLight ? "border-slate-200" : "border-white/10")}>
          <Bot className="h-5 w-5 text-teal" />
          <div>
            <h3 className={cn("font-bold", title)}>Asistente SEO & competencia</h3>
            <p className={cn("text-xs", muted)}>
              Gratis con Google AI Studio (Gemini). Analiza URLs públicas de competencia.
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className={cn("text-xs font-semibold", muted)}>
              URLs competencia (hasta 3, una por línea)
            </label>
            <Textarea
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              rows={2}
              className="mt-1 text-sm"
              placeholder="https://competidor.cl"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void send(q)}
                className={cn(
                  "text-left text-xs rounded-full px-3 py-1.5 border transition-colors",
                  isLight
                    ? "border-slate-200 hover:bg-slate-50 text-slate-700"
                    : "border-white/15 hover:bg-white/5 text-white/80",
                )}
              >
                {q}
              </button>
            ))}
          </div>

          <div className={cn("h-72 overflow-y-auto rounded-xl p-3 space-y-3", isLight ? "bg-slate-50" : "bg-black/20")}>
            {chat.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn(
                  "text-sm rounded-2xl px-3 py-2 max-w-[95%] whitespace-pre-wrap leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-teal/20 text-inherit"
                    : isLight
                      ? "bg-white border border-slate-200"
                      : "bg-white/5 border border-white/10",
                )}
              >
                {m.text}
                {m.provider ? (
                  <span className={cn("block mt-2 text-[10px] uppercase tracking-wide", muted)}>
                    via {m.provider}
                  </span>
                ) : null}
              </div>
            ))}
            {sending ? (
              <div className={cn("flex items-center gap-2 text-sm", muted)}>
                <Loader2 className="h-4 w-4 animate-spin" /> Analizando…
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ej: ¿Qué copy usa mejor la competencia en Rapa Nui?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button onClick={() => void send()} disabled={sending} className="bg-teal text-navy shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {!overview?.geminiConfigured ? (
            <p className={cn("text-xs leading-relaxed", muted)}>
              Para IA completa gratis: entra a{" "}
              <a className="text-teal underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                aistudio.google.com/apikey
              </a>
              , crea una key y en el servidor agrega{" "}
              <code className="text-[11px]">GEMINI_API_KEY=...</code> (compartida para Ricardo y Rocío).
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Metric({
  card,
  title,
  muted,
  label,
  value,
  hint,
  icon,
  delta,
  up,
}: {
  card: string;
  title: string;
  muted: string;
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  delta?: number | null;
  up?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border p-4", card)}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-xs font-medium", muted)}>{label}</span>
        {icon}
      </div>
      <p className={cn("text-2xl font-black tabular-nums", title)}>{value}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className={cn("text-[11px]", muted)}>{hint}</span>
        {delta !== null && delta !== undefined ? (
          <span className={cn("text-[11px] font-bold inline-flex items-center gap-0.5", up ? "text-emerald-400" : "text-rose-400")}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
