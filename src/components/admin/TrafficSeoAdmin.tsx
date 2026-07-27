"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "@/contexts/AdminThemeContext";
import { cn } from "@/lib/utils";
import type { ConnectionCheck, RecentLeadRow, TrafficOverview } from "@/lib/traffic-overview";

type Ga4Realtime = {
  configured: boolean;
  activeUsers: number | null;
  topPages: { path: string; users: number }[];
  error?: string;
  generatedAt: string;
};

type Ga4Summary = {
  configured: boolean;
  sessions: number | null;
  users: number | null;
  pageviews: number | null;
  error?: string;
};

type ChatMsg = { role: "user" | "assistant"; text: string; provider?: string };

const QUICK = [
  "¿Dónde debemos atacar esta semana para más tráfico y cotizaciones?",
  "Analiza la competencia y dime qué están haciendo mejor que nosotros",
  "Plan SEO 7 días para Rapa Nui / Tapati y Atacama",
  "Qué mejorar en móvil y conversión (WhatsApp + cotizar)",
];

const SEO_ACTIONS = [
  { label: "Hub Viajes a Chile", href: "/viajes/chile" },
  { label: "Índice /viajes", href: "/viajes" },
  { label: "Blog", href: "/blog" },
  { label: "Search Console", href: "https://search.google.com/search-console", external: true },
  { label: "GA Tiempo real", href: "https://analytics.google.com/analytics/web/#/p/realtime/overview", external: true },
];

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
}

function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "hace un momento";
  if (ms < 3_600_000) return `hace ${Math.floor(ms / 60_000)} min`;
  if (ms < 86_400_000) return `hace ${Math.floor(ms / 3_600_000)} h`;
  return `hace ${Math.floor(ms / 86_400_000)} d`;
}

export function TrafficSeoAdmin() {
  const { isLight } = useAdminTheme();
  const [days, setDays] = useState(28);
  const [overview, setOverview] = useState<TrafficOverview | null>(null);
  const [realtime, setRealtime] = useState<Ga4Realtime | null>(null);
  const [summary, setSummary] = useState<Ga4Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [competitorInput, setCompetitorInput] = useState(
    "https://www.destinos.cl\nhttps://www.chile.travel",
  );
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Hola Ricardo y Rocío 👋 Soy el asistente SEO de Universo Nómada. Leo métricas del negocio (y GA4 si está configurado), analizo competencia y digo dónde atacar.",
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

  const loadOverview = useCallback(async (d: number, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/analytics/overview?days=${d}`, { credentials: "include" });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(String(data.error || "Error"));
      setOverview(data as unknown as TrafficOverview);
      setLastUpdated(new Date().toISOString());
    } catch {
      if (!silent) toast.error("No se pudieron cargar las métricas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadGa4 = useCallback(async (d: number) => {
    try {
      const res = await fetch(`/api/admin/analytics/realtime?days=${d}&summary=1`, {
        credentials: "include",
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) return;
      if (data.realtime && typeof data.realtime === "object") {
        setRealtime(data.realtime as Ga4Realtime);
      }
      if (data.summary && typeof data.summary === "object") {
        setSummary(data.summary as Ga4Summary);
      }
    } catch {
      /* opcional */
    }
  }, []);

  useEffect(() => {
    void loadOverview(days, false);
    void loadGa4(days);
  }, [days, loadOverview, loadGa4]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadOverview(days, true);
      void loadGa4(days);
    }, 20_000);
    return () => window.clearInterval(id);
  }, [days, loadOverview, loadGa4]);

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
  const maxDest = Math.max(1, ...(overview?.byDestination.map((d) => d.count) ?? [1]));
  const maxSrc = Math.max(1, ...(overview?.bySource.map((s) => s.count) ?? [1]));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={cn("text-2xl font-black tracking-tight", title)}>Tráfico & SEO</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-bold px-2.5 py-1">
              <Radio className="h-3 w-3 animate-pulse" /> En vivo
            </span>
          </div>
          <p className={cn("text-sm mt-1", muted)}>
            {overview?.sharedNote ?? "Vista compartida del negocio (Ricardo + Rocío)."}
            {lastUpdated ? ` · Actualizado ${formatTime(lastUpdated)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void loadOverview(days, true);
              void loadGa4(days);
            }}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {loading || !overview ? (
        <div className={cn("rounded-2xl border p-12 flex justify-center", card)}>
          <Loader2 className="h-6 w-6 animate-spin text-teal" />
        </div>
      ) : (
        <>
          {/* Ahora — negocio + GA4 */}
          <section className="space-y-3">
            <h3 className={cn("text-xs font-bold uppercase tracking-wide", muted)}>Ahora</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric
                card={card}
                title={title}
                muted={muted}
                label="Leads (1 h)"
                value={String(overview.leadsLast1h)}
                hint="Última hora"
                icon={<Activity className="h-4 w-4 text-emerald-400" />}
              />
              <Metric
                card={card}
                title={title}
                muted={muted}
                label="Leads (24 h)"
                value={String(overview.leadsLast24h)}
                hint={`Checkouts 24h: ${overview.checkoutsLast24h}`}
                icon={<Users className="h-4 w-4 text-teal" />}
              />
              <Metric
                card={card}
                title={title}
                muted={muted}
                label="Usuarios en el sitio"
                value={
                  realtime?.configured && realtime.activeUsers != null
                    ? String(realtime.activeUsers)
                    : "—"
                }
                hint={
                  realtime?.configured
                    ? realtime.error
                      ? realtime.error.slice(0, 48)
                      : "GA4 tiempo real"
                    : "Configura GA4 API en .env"
                }
                icon={<Radio className="h-4 w-4 text-amber-400" />}
              />
              <Metric
                card={card}
                title={title}
                muted={muted}
                label={`Sesiones GA (${days}d)`}
                value={
                  summary?.configured && summary.sessions != null
                    ? String(summary.sessions)
                    : "—"
                }
                hint={
                  summary?.users != null
                    ? `${summary.users} usuarios · ${summary.pageviews ?? "—"} vistas`
                    : "Requiere service account"
                }
                icon={<BarChart3 className="h-4 w-4 text-sky-400" />}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className={cn("rounded-2xl border p-5", card)}>
                <h3 className={cn("font-bold mb-3", title)}>Actividad reciente</h3>
                {overview.recentLeads.length === 0 ? (
                  <p className={cn("text-sm", muted)}>Sin leads todavía.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {overview.recentLeads.map((l: RecentLeadRow) => (
                      <li key={l.id} className="flex justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className={cn("font-semibold truncate", title)}>{l.nameMasked}</p>
                          <p className={cn("text-xs truncate", muted)}>
                            {l.destino || "Sin destino"} · {l.source || "web"}
                          </p>
                        </div>
                        <span className={cn("text-[11px] shrink-0 tabular-nums", muted)}>
                          {relativeAge(l.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={cn("rounded-2xl border p-5", card)}>
                <h3 className={cn("font-bold mb-3", title)}>Páginas activas (GA4)</h3>
                {!realtime?.configured ? (
                  <p className={cn("text-sm leading-relaxed", muted)}>
                    Para ver usuarios y páginas en vivo aquí: agregá{" "}
                    <code className="text-[11px]">GA4_PROPERTY_ID</code> +{" "}
                    <code className="text-[11px]">GA4_SERVICE_ACCOUNT_JSON</code> en el .env del
                    servidor (Viewer en la propiedad GA4).
                  </p>
                ) : realtime.error && realtime.activeUsers == null ? (
                  <p className={cn("text-sm text-rose-400", "")}>{realtime.error}</p>
                ) : realtime.topPages.length === 0 ? (
                  <p className={cn("text-sm", muted)}>Nadie activo en este momento (o aún sin datos).</p>
                ) : (
                  <ul className="space-y-2">
                    {realtime.topPages.map((p) => (
                      <li key={p.path} className="flex justify-between text-sm gap-2">
                        <span className={cn("truncate", title)}>{p.path}</span>
                        <span className={cn("font-bold tabular-nums", muted)}>{p.users}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Periodo */}
          <section className="space-y-3">
            <h3 className={cn("text-xs font-bold uppercase tracking-wide", muted)}>
              Periodo ({overview.periodDays}d)
            </h3>
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
                  <ul className="space-y-3">
                    {overview.byDestination.map((d) => (
                      <li key={d.name} className="space-y-1">
                        <div className="flex justify-between text-sm gap-2">
                          <span className={cn("truncate", title)}>{d.name}</span>
                          <span className={cn("font-bold tabular-nums", muted)}>{d.count}</span>
                        </div>
                        <div className={cn("h-1.5 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-white/10")}>
                          <div
                            className="h-full rounded-full bg-teal"
                            style={{ width: `${Math.round((d.count / maxDest) * 100)}%` }}
                          />
                        </div>
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
                  <ul className="space-y-3">
                    {overview.bySource.map((s) => (
                      <li key={s.name} className="space-y-1">
                        <div className="flex justify-between text-sm gap-2">
                          <span className={cn("truncate", title)}>{s.name}</span>
                          <span className={cn("font-bold tabular-nums", muted)}>{s.count}</span>
                        </div>
                        <div className={cn("h-1.5 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-white/10")}>
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${Math.round((s.count / maxSrc) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* SEO / estado */}
          <section className="space-y-3">
            <h3 className={cn("text-xs font-bold uppercase tracking-wide", muted)}>SEO y conexiones</h3>

            <div className={cn("rounded-2xl border p-5", card)}>
              <h3 className={cn("font-bold mb-3", title)}>Estado de conexiones</h3>
              <ul className="space-y-3">
                {overview.connections.map((c: ConnectionCheck) => (
                  <li key={c.id} className="flex gap-3 text-sm">
                    {c.ok ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={cn("font-semibold", title)}>{c.label}</p>
                      <p className={cn("text-xs mt-0.5 leading-relaxed", muted)}>{c.detail}</p>
                      {c.href ? (
                        <a
                          href={c.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-teal text-xs mt-1 hover:underline"
                        >
                          Abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn("rounded-2xl border p-5", card)}>
              <h3 className={cn("font-bold mb-3", title)}>Próximas acciones SEO</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {SEO_ACTIONS.map((a) =>
                  a.external ? (
                    <a
                      key={a.href}
                      href={a.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-teal/30 px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal/10"
                    >
                      {a.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <a
                      key={a.href}
                      href={a.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-teal/30 px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal/10"
                    >
                      {a.label}
                    </a>
                  ),
                )}
              </div>
              <ul className="space-y-2">
                {overview.recommendations.map((r) => (
                  <li
                    key={r}
                    className={cn("text-sm leading-relaxed pl-3 border-l-2 border-teal/40", muted)}
                  >
                    <span className={title}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Chat SEO */}
      <div className={cn("rounded-2xl border overflow-hidden", card)}>
        <div
          className={cn(
            "px-5 py-4 border-b flex items-center gap-2",
            isLight ? "border-slate-200" : "border-white/10",
          )}
        >
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

          <div
            className={cn(
              "h-72 overflow-y-auto rounded-xl p-3 space-y-3",
              isLight ? "bg-slate-50" : "bg-black/20",
            )}
          >
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

          {overview && !overview.geminiConfigured ? (
            <p className={cn("text-xs leading-relaxed", muted)}>
              Para IA completa gratis:{" "}
              <a
                className="text-teal underline"
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
              >
                aistudio.google.com/apikey
              </a>
              , y en el servidor{" "}
              <code className="text-[11px]">GEMINI_API_KEY=...</code>
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
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        <span className={cn("text-[11px]", muted)}>{hint}</span>
        {delta !== null && delta !== undefined ? (
          <span
            className={cn(
              "text-[11px] font-bold inline-flex items-center gap-0.5",
              up ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
