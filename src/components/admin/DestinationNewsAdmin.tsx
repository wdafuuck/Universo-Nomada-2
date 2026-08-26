"use client";

import { useCallback, useEffect, useState } from "react";
import { Newspaper, RefreshCw, Loader2, AlertTriangle, Info, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { DestinationNewsItem, DestinationNewsReport } from "@/lib/destination-news";

/** Fondos suaves + texto oscuro legible (tema claro/oscuro del admin). */
function severityStyle(s: DestinationNewsItem["severity"]) {
  switch (s) {
    case "alta":
      return {
        card: "border-red-300 bg-red-50",
        badge: "bg-red-600 text-white",
        icon: "text-red-700",
        meta: "text-red-900/70",
        title: "text-slate-900",
        body: "text-slate-800",
        hint: "text-slate-700",
        source: "text-slate-500",
      };
    case "media":
      return {
        card: "border-amber-300 bg-amber-50",
        badge: "bg-amber-600 text-white",
        icon: "text-amber-700",
        meta: "text-amber-900/70",
        title: "text-slate-900",
        body: "text-slate-800",
        hint: "text-slate-700",
        source: "text-slate-500",
      };
    case "baja":
      return {
        card: "border-sky-300 bg-sky-50",
        badge: "bg-sky-700 text-white",
        icon: "text-sky-800",
        meta: "text-sky-900/70",
        title: "text-slate-900",
        body: "text-slate-800",
        hint: "text-slate-700",
        source: "text-slate-500",
      };
    default:
      return {
        card: "border-slate-200 bg-white",
        badge: "bg-slate-700 text-white",
        icon: "text-slate-600",
        meta: "text-slate-600",
        title: "text-slate-900",
        body: "text-slate-800",
        hint: "text-slate-700",
        source: "text-slate-500",
      };
  }
}

function SeverityIcon({ s, className }: { s: DestinationNewsItem["severity"]; className?: string }) {
  if (s === "alta" || s === "media") return <AlertTriangle className={`h-5 w-5 shrink-0 ${className ?? ""}`} />;
  if (s === "baja") return <Shield className={`h-5 w-5 shrink-0 ${className ?? ""}`} />;
  return <Info className={`h-5 w-5 shrink-0 ${className ?? ""}`} />;
}

export function DestinationNewsAdmin() {
  const [report, setReport] = useState<DestinationNewsReport | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/destination-news", {
        credentials: "include",
        method: refresh ? "POST" : "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setReport(data.report);
      setGeminiConfigured(Boolean(data.geminiConfigured));
      if (refresh) toast.success("Briefing actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-teal" /> Noticias — briefing interno
          </h2>
          <p className="text-white/40 text-sm mt-1 max-w-2xl">
            Solo visible para ti en el admin. Cada día un reporte sobre tus destinos: cierres,
            pasos fronterizos, visas, vacunas y alertas operativas.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing || loading}
          className="bg-teal text-[#070f1a] font-bold rounded-xl shrink-0"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualizar ahora
        </Button>
      </div>

      {geminiConfigured === false && (
        <div className="rounded-2xl border border-amber-400 bg-amber-50 p-4 text-amber-950 text-sm">
          Falta <code className="text-xs font-semibold">GEMINI_API_KEY</code> en el servidor. Sin ella el
          briefing usa modo básico.
        </div>
      )}
      {geminiConfigured === true && (
        <div className="rounded-2xl border border-teal/40 bg-teal/15 px-4 py-2 text-teal-ink text-xs font-semibold">
          Gemini conectado — el reporte usa IA + búsqueda web
        </div>
      )}

      {loading && !report ? (
        <div className="text-white/40 py-16 text-center flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Generando briefing del día…
        </div>
      ) : report ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
            <p className="text-teal-ink text-xs font-bold uppercase tracking-wider">
              {report.date} · {report.provider === "cache" ? "caché del día" : report.provider}
            </p>
            <h3 className="text-slate-900 text-lg font-bold leading-snug">{report.headline}</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Destinos monitoreados: {report.destinations.slice(0, 12).join(" · ")}
              {report.destinations.length > 12 ? "…" : ""}
            </p>
          </div>

          <ul className="space-y-3">
            {report.items.map((item, i) => {
              const s = severityStyle(item.severity);
              return (
                <li key={`${item.title}-${i}`} className={`rounded-2xl border p-4 shadow-sm ${s.card}`}>
                  <div className="flex items-start gap-3">
                    <SeverityIcon s={item.severity} className={s.icon} />
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.badge}`}
                        >
                          {item.severity}
                        </span>
                        <span className={`text-xs font-semibold ${s.meta}`}>
                          {item.destination}
                          {item.country ? ` · ${item.country}` : ""}
                        </span>
                      </div>
                      <p className={`font-bold text-sm sm:text-base leading-snug ${s.title}`}>
                        {item.title}
                      </p>
                      <p className={`text-sm leading-relaxed ${s.body}`}>{item.summary}</p>
                      {item.actionHint ? (
                        <p className={`text-xs font-semibold pt-1 ${s.hint}`}>→ {item.actionHint}</p>
                      ) : null}
                      {item.sourceHint ? (
                        <p className={`text-[11px] ${s.source}`}>Fuente orientativa: {item.sourceHint}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
