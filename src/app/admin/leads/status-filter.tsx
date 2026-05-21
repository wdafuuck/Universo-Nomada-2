"use client";

import Link from "next/link";
import { LeadStatus } from "@prisma/client";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: LeadStatus.NEW, label: "Nuevos" },
  { value: LeadStatus.CONTACTED, label: "Contactados" },
  { value: LeadStatus.IN_PROGRESS, label: "En proceso" },
  { value: LeadStatus.CONVERTED, label: "Convertidos" },
  { value: LeadStatus.LOST, label: "Perdidos" },
];

export function StatusFilter({
  active,
  counts,
}: {
  active: string;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const isActive = active === f.value;
        const count = f.value === "all" ? counts.total : counts[f.value] ?? 0;
        return (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/leads" : `/admin/leads?status=${f.value}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              isActive
                ? "bg-navy text-white border-navy"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {f.label}
            <span
              className={`text-xs px-1.5 rounded-full ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
