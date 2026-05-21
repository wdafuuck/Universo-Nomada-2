"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Tag,
  MapPin,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/login/actions";

const nav = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, ready: true },
  { href: "/admin/leads", label: "Leads", icon: Users, ready: true },
  { href: "/admin/promociones", label: "Promociones", icon: Tag, ready: true },
  { href: "/admin/destinos", label: "Destinos", icon: MapPin, ready: true },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy text-white transform transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <Image
            src="/images/logo-un.png"
            alt="Universo Nomada"
            width={36}
            height={36}
            className="rounded-full ring-1 ring-teal/40"
          />
          <div className="leading-tight">
            <p className="font-extrabold text-sm tracking-wide">UNIVERSO</p>
            <p className="text-[10px] font-bold text-teal tracking-[0.2em]">NOMADA</p>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const className = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? "bg-teal text-navy"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            } ${item.ready ? "" : "opacity-50 cursor-not-allowed"}`;

            if (!item.ready) {
              return (
                <span key={item.href} className={className} aria-disabled>
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    Pronto
                  </span>
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={className}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 space-y-2">
          <div className="px-3 py-2 text-xs text-white/50 truncate">
            {email}
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-sm font-semibold text-slate-600 hidden lg:block">
            Panel de administración
          </h1>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            ← Ver sitio público
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export { X };
