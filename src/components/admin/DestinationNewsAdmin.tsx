"use client";

import { useCallback, useEffect, useState } from "react";
import { Newspaper, RefreshCw, Loader2, AlertTriangle, Info, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { DestinationNewsItem, DestinationNewsReport } from "@/lib/destination-news";

function severityStyle(s: DestinationNewsItem["severity"]) {
  switch (s) {
    case "alta":
      return "border-red-500/40 bg-red-500/10 text-red-200";
    case "media":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    case "baja":
      return "border-sky-500/40 bg-sky-500/10 text-sky-100";
    default:
      return "border-white/15 bg-white/5 text-white/80";
  }
}

function SeverityIcon({ s }: { s: DestinationNewsItem["severity"] }) {
  if (s === "alta" || s === "media") return <AlertTriangle className="h-4 w-4 shrink-0" />;
  if (s === "baja") return <Shield className="h-4 w-4 shrink-0" />;
  return <Info className="h-4 w-4 shrink-0" />;
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
      const res = await fetch(
        refresh ? "/api/admin/destination-news" : "/api/admin/destination-news",
        { credentials: "include", method: refresh ? "POST" : "GET" },
      );
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
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100 text-sm">
          Falta <code className="text-xs">GEMINI_API_KEY</code> en el servidor. Sin ella el briefing
          usa modo básico. Se configura en el <code className="text-xs">.env</code> de producción
          (Google AI Studio).
        </div>
      )}
      {geminiConfigured === true && (
        <div className="rounded-2xl border border-teal/30 bg-teal/10 px-4 py-2 text-teal text-xs font-semibold">
          Gemini conectado — el reporte usa IA + búsqueda web
        </div>
      )}

      {loading && !report ? (
        <div className="text-white/40 py-16 text-center flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Generando briefing del día…
        </div>
      ) : report ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
            <p className="text-teal text-xs font-bold uppercase tracking-wider">
              {report.date} · {report.provider === "cache" ? "caché del día" : report.provider}
            </p>
            <h3 className="text-white text-lg font-bold leading-snug">{report.headline}</h3>
            <p className="text-white/40 text-xs">
              Destinos monitoreados: {report.destinations.slice(0, 12).join(" · ")}
              {report.destinations.length > 12 ? "…" : ""}
            </p>
          </div>

          <ul className="space-y-3">
            {report.items.map((item, i) => (
              <li
                key={`${item.title}-${i}`}
                className={`rounded-2xl border p-4 ${severityStyle(item.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <SeverityIcon s={item.severity} />
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        {item.severity}
                      </span>
                      <span className="text-xs font-semibold opacity-90">
                        {item.destination}
                        {item.country ? ` · ${item.country}` : ""}
                      </span>
                    </div>
                    <p className="font-bold text-sm sm:text-base leading-snug text-white">
                      {item.title}
                    </p>
                    <p className="text-sm leading-relaxed opacity-90">{item.summary}</p>
                    {item.actionHint ? (
                      <p className="text-xs font-medium pt-1 opacity-80">→ {item.actionHint}</p>
                    ) : null}
                    {item.sourceHint ? (
                      <p className="text-[11px] opacity-50">Fuente orientativa: {item.sourceHint}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
