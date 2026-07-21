"use client";

import type { ReactNode } from "react";
import { LayoutDashboard, MapPin, DollarSign, Tag, Users, X, Sparkles, ImageIcon, CalendarDays, FileText, Sun, Moon, Gift, Stamp, UserCircle, BookOpen, Mail, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminThemeProvider, useAdminTheme } from "@/contexts/AdminThemeContext";
import { cn } from "@/lib/utils";

export type AdminTab = "dashboard" | "portada" | "paquetes" | "precios" | "promos" | "codigos" | "grupales" | "contenido" | "blog" | "anuncios" | "clientes" | "leads" | "beneficios" | "pasaporte";

const TABS: { id: AdminTab; label: string; desc: string; icon: typeof MapPin }[] = [
  { id: "dashboard", label: "Inicio", desc: "Resumen general", icon: LayoutDashboard },
  { id: "portada", label: "Banner principal", desc: "Fotos del hero", icon: ImageIcon },
  { id: "paquetes", label: "Paquetes", desc: "Precios, fotos y tours", icon: MapPin },
  { id: "grupales", label: "Viajes grupales", desc: "Fechas y cupos", icon: CalendarDays },
  { id: "precios", label: "Precios avanzados", desc: "Por pasajero y hoteles", icon: DollarSign },
  { id: "promos", label: "Promociones", desc: "Ofertas del mes", icon: Tag },
  { id: "codigos", label: "Códigos descuento", desc: "Cupones al pagar", icon: Ticket },
  { id: "contenido", label: "Contenido", desc: "FAQ y cómo funciona", icon: FileText },
  { id: "blog", label: "Blog", desc: "Artículos y noticias", icon: BookOpen },
  { id: "anuncios", label: "Anuncios", desc: "Correos a clientes", icon: Mail },
  { id: "beneficios", label: "Beneficios", desc: "Cupones para clientes", icon: Gift },
  { id: "pasaporte", label: "Pasaporte", desc: "Insignias de destinos", icon: Stamp },
  { id: "clientes", label: "Clientes", desc: "Cuentas y viajes", icon: UserCircle },
  { id: "leads", label: "Leads", desc: "Cotizaciones y reservas", icon: Users },
];

function AdminShellInner({
  activeTab,
  onTabChange,
  onClose,
  children,
}: {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const { theme, isLight, toggleTheme } = useAdminTheme();
  const current = TABS.find((t) => t.id === activeTab);

  return (
    <div
      data-admin-theme={theme}
      className={cn(
        "fixed inset-0 z-[100] overflow-hidden flex flex-col md:flex-row",
        isLight ? "bg-slate-100" : "bg-[#070f1a]"
      )}
    >
      <aside
        className={cn(
          "md:w-64 shrink-0 border-b md:border-b-0 md:border-r flex flex-col min-h-0 md:max-h-screen",
          isLight ? "bg-white border-slate-200" : "bg-[#0a1628] border-white/10"
        )}
      >
        <div className={cn("shrink-0 p-5 border-b", isLight ? "border-slate-200" : "border-white/10")}>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal to-emerald-400 flex items-center justify-center shadow-lg shadow-teal/20">
              <Sparkles className="h-5 w-5 text-[#070f1a]" />
            </div>
            <div>
              <p className={cn("font-black text-lg leading-tight", isLight ? "text-slate-900" : "text-white")}>
                Universo Nómada
              </p>
              <p className="text-teal/80 text-xs font-medium">Panel de control</p>
            </div>
          </div>
        </div>

        <nav className="flex md:flex-col gap-1 p-3 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden flex-1 min-h-0">
          {TABS.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all shrink-0 md:shrink md:w-full",
                activeTab === id
                  ? "bg-teal text-[#070f1a] shadow-md shadow-teal/25"
                  : isLight
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <div className="hidden sm:block min-w-0">
                <p className="font-semibold text-sm leading-tight">{label}</p>
                <p
                  className={cn(
                    "text-[11px] truncate",
                    activeTab === id ? "text-[#070f1a]/70" : isLight ? "text-slate-400" : "text-white/35"
                  )}
                >
                  {desc}
                </p>
              </div>
            </button>
          ))}
        </nav>

        <div className="hidden md:block shrink-0 p-4">
          <div
            className={cn(
              "rounded-xl border p-4 text-xs leading-relaxed",
              isLight
                ? "bg-slate-50 border-slate-200 text-slate-500"
                : "bg-white/5 border-white/10 text-white/50"
            )}
          >
            Los cambios se publican al cerrar el panel con <strong className="text-teal">Ver sitio web</strong>.
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header
          className={cn(
            "shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b backdrop-blur-md",
            isLight ? "border-slate-200 bg-white/90" : "border-white/10 bg-[#070f1a]/80"
          )}
        >
          <div>
            <h1 className={cn("font-bold text-xl", isLight ? "text-slate-900" : "text-white")}>
              {current?.label ?? "Admin"}
            </h1>
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-white/40")}>{current?.desc}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleTheme}
              title={isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
              className={cn(
                "rounded-xl font-semibold",
                isLight
                  ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              {isLight ? <Moon className="h-4 w-4 sm:mr-2" /> : <Sun className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">{isLight ? "Tema oscuro" : "Tema claro"}</span>
            </Button>
            <Button
              onClick={onClose}
              className="bg-teal hover:bg-teal/90 text-[#070f1a] font-bold rounded-xl px-5"
            >
              <X className="h-4 w-4 mr-2" />
              Ver sitio web
            </Button>
          </div>
        </header>

        <main className={cn("flex-1 overflow-y-auto p-4 sm:p-6 admin-content-area", isLight ? "bg-slate-100" : "")}>
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminShell({
  activeTab,
  onTabChange,
  onClose,
  children,
}: {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AdminThemeProvider>
      <AdminShellInner activeTab={activeTab} onTabChange={onTabChange} onClose={onClose}>
        {children}
      </AdminShellInner>
    </AdminThemeProvider>
  );
}
