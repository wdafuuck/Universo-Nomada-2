"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { MapPin, Tag, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminShell, type AdminTab } from "@/components/admin/AdminShell";

const HeroSlidesAdmin = dynamic(
  () => import("@/components/admin/HeroSlidesAdmin").then((m) => ({ default: m.HeroSlidesAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando banner...</div> }
);
const PackagesAdmin = dynamic(
  () => import("@/components/admin/PackagesAdmin").then((m) => ({ default: m.PackagesAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando paquetes...</div> }
);
const TourPricingAdmin = dynamic(
  () => import("@/components/admin/TourPricingAdmin").then((m) => ({ default: m.TourPricingAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando precios...</div> }
);
const DiscountCodesAdmin = dynamic(
  () => import("@/components/admin/DiscountCodesAdmin").then((m) => ({ default: m.DiscountCodesAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando códigos...</div> }
);
const GroupTripsAdmin = dynamic(
  () => import("@/components/admin/GroupTripsAdmin").then((m) => ({ default: m.GroupTripsAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando viajes grupales...</div> }
);
const LeadsAdmin = dynamic(
  () => import("@/components/admin/LeadsAdmin").then((m) => ({ default: m.LeadsAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando leads...</div> }
);
const SiteContentAdmin = dynamic(
  () => import("@/components/admin/SiteContentAdmin").then((m) => ({ default: m.SiteContentAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando contenido...</div> }
);
const NomadBenefitsAdmin = dynamic(
  () => import("@/components/admin/NomadBenefitsAdmin").then((m) => ({ default: m.NomadBenefitsAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando beneficios...</div> }
);
const PassportBadgesAdmin = dynamic(
  () => import("@/components/admin/PassportBadgesAdmin").then((m) => ({ default: m.PassportBadgesAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando pasaporte...</div> }
);
const MembersAdmin = dynamic(
  () => import("@/components/admin/MembersAdmin").then((m) => ({ default: m.MembersAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando clientes...</div> }
);
const BlogAdmin = dynamic(
  () => import("@/components/admin/BlogAdmin").then((m) => ({ default: m.BlogAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando blog...</div> }
);
const CampaignsAdmin = dynamic(
  () => import("@/components/admin/CampaignsAdmin").then((m) => ({ default: m.CampaignsAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando anuncios...</div> }
);
const TrafficSeoAdmin = dynamic(
  () => import("@/components/admin/TrafficSeoAdmin").then((m) => ({ default: m.TrafficSeoAdmin })),
  { loading: () => <div className="text-white/40 py-12 text-center">Cargando tráfico & SEO...</div> }
);

export function LandingAdminPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("paquetes");
  const [leads, setLeads] = useState<unknown[]>([]);
  const [statsData, setStatsData] = useState<{
    totalLeads: number;
    totalPromotions: number;
    recentLeads: unknown[];
    byDestination: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, statsRes] = await Promise.all([
          fetch("/api/admin/leads", { credentials: "include" }),
          fetch("/api/admin/stats", { credentials: "include" }),
        ]);
        const leadsData = await leadsRes.json();
        const statsDataRes = await statsRes.json();
        setLeads(leadsData.leads || []);
        setStatsData(statsDataRes);
      } catch {
        toast.error("Error cargando datos");
      }
    };
    fetchData();
  }, []);

  return (
    <AdminShell activeTab={activeTab} onTabChange={setActiveTab} onClose={onClose}>
      {activeTab === "dashboard" && statsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-[#0f1f35] border-white/10 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-teal/15 flex items-center justify-center">
                    <Users className="h-6 w-6 text-teal" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Total Leads</p>
                    <p className="text-3xl font-black text-white">{statsData.totalLeads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0f1f35] border-white/10 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber/15 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-amber" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Promociones</p>
                    <p className="text-3xl font-black text-white">{statsData.totalPromotions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0f1f35] border-white/10 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-sm">Destinos</p>
                    <p className="text-3xl font-black text-white">
                      {Object.keys(statsData.byDestination).length || 10}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {Object.keys(statsData.byDestination).length > 0 && (
            <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-white font-bold mb-4">Leads por Destino</h3>
                <div className="space-y-3">
                  {Object.entries(statsData.byDestination)
                    .sort((a, b) => b[1] - a[1])
                    .map(([dest, count]) => (
                      <div key={dest} className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">{dest}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 rounded-full bg-teal"
                            style={{ width: `${Math.min(count * 40, 200)}px` }}
                          />
                          <span className="text-teal font-bold text-sm">{count as number}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "dashboard" && !statsData && (
        <div className="flex items-center justify-center py-20 text-white/40">Cargando estadísticas...</div>
      )}

      {activeTab === "trafico" && <TrafficSeoAdmin />}

      {activeTab === "clientes" && <MembersAdmin />}
      {activeTab === "leads" && <LeadsAdmin />}

      {activeTab === "portada" && <HeroSlidesAdmin />}
      {activeTab === "paquetes" && <PackagesAdmin />}
      {activeTab === "grupales" && <GroupTripsAdmin />}
      {activeTab === "precios" && <TourPricingAdmin />}
      {activeTab === "codigos" && <DiscountCodesAdmin />}
      {activeTab === "contenido" && <SiteContentAdmin />}
      {activeTab === "blog" && <BlogAdmin />}
      {activeTab === "anuncios" && <CampaignsAdmin />}
      {activeTab === "beneficios" && <NomadBenefitsAdmin />}
      {activeTab === "pasaporte" && <PassportBadgesAdmin />}
    </AdminShell>
  );
}
