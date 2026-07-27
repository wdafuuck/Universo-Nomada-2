"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PlatformPayload = {
  tenant: { id: string; name: string; slug: string; configJson: string };
  featureFlags: Record<string, boolean>;
  channelProviders: string[];
  platformVersion: string;
};

export function PlatformAdmin() {
  const [data, setData] = useState<PlatformPayload | null>(null);
  const [recon, setRecon] = useState<{
    totals: { payments: number; amountSum: number; withExternalId: number; withoutExternalId: number };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [platRes, reconRes] = await Promise.all([
          fetch("/api/admin/platform", { credentials: "include" }),
          fetch("/api/admin/payments/reconciliation", { credentials: "include" }),
        ]);
        if (platRes.ok && !cancelled) setData(await platRes.json());
        if (reconRes.ok && !cancelled) setRecon(await reconRes.json());
      } catch {
        toast.error("No se pudo cargar la plataforma");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return <div className="text-white/40 py-12 text-center">Cargando plataforma...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-lg">Plataforma</h2>
        <p className="text-white/50 text-sm">
          Tenant default y flags — sin cambios visuales en la web pública.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0f1f35] p-5 space-y-2">
        <p className="text-white font-semibold">{data.tenant.name}</p>
        <p className="text-white/50 text-sm">
          id: {data.tenant.id} · slug: {data.tenant.slug} · v{data.platformVersion}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0f1f35] p-5">
        <h3 className="text-white font-semibold mb-3">Feature flags</h3>
        <ul className="space-y-1 text-sm">
          {Object.entries(data.featureFlags).map(([k, v]) => (
            <li key={k} className="flex justify-between text-white/70">
              <span>{k}</span>
              <span className={v ? "text-teal" : "text-white/30"}>{v ? "on" : "off"}</span>
            </li>
          ))}
        </ul>
      </div>

      {recon && (
        <div className="rounded-xl border border-white/10 bg-[#0f1f35] p-5 space-y-2">
          <h3 className="text-white font-semibold">Conciliación de pagos</h3>
          <p className="text-white/60 text-sm">
            {recon.totals.payments} pagos · suma ${recon.totals.amountSum.toLocaleString("es-CL")} · con
            ID externo {recon.totals.withExternalId} · sin ID {recon.totals.withoutExternalId}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {data.channelProviders.map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={async () => {
              const res = await fetch("/api/admin/platform", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "sync_channel", provider: p }),
              });
              const json = await res.json();
              toast.message(json.message ?? "Sync stub");
            }}
          >
            Sync {p}
          </Button>
        ))}
      </div>
    </div>
  );
}
