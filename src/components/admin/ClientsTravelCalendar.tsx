"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildCalendarTravelers,
  eachDayInclusive,
  type AdminCalendarTraveler,
} from "@/lib/admin-client-trips";

type UserLike = {
  id: string;
  name: string | null;
  email: string;
  leads: {
    id: number;
    status: string;
    destino: string | null;
    checkIn?: string | null;
    checkOut?: string | null;
    tripEndDate?: string | null;
  }[];
};

type Props = {
  users: UserLike[];
  onSelectUser: (userId: string) => void;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function monthLabel(d: Date): string {
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

function toIsoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  // Monday-first: getDay Sun=0 → 6, Mon=1 → 0
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toIsoDay(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function ClientsTravelCalendar({ users, onSelectUser }: Props) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const travelers = useMemo(() => {
    // Adapt API shape (checkIn on lead already) to helper that expects cartJson
    const adapted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      leads: u.leads.map((l) => ({
        id: l.id,
        status: l.status,
        destino: l.destino,
        tripEndDate: l.tripEndDate,
        cartJson:
          l.checkIn || l.checkOut
            ? JSON.stringify([
                {
                  checkIn: l.checkIn ?? undefined,
                  checkOut: l.checkOut ?? undefined,
                },
              ])
            : null,
      })),
    }));
    return buildCalendarTravelers(adapted);
  }, [users]);

  const byDay = useMemo(() => {
    const map = new Map<string, AdminCalendarTraveler[]>();
    for (const t of travelers) {
      for (const day of eachDayInclusive(t.checkIn, t.checkOut)) {
        const list = map.get(day) ?? [];
        list.push(t);
        map.set(day, list);
      }
    }
    return map;
  }, [travelers]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = buildMonthGrid(year, month);
  const todayIso = toIsoDay(new Date());

  const monthTravelers = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const seen = new Set<number>();
    const list: AdminCalendarTraveler[] = [];
    for (const t of travelers) {
      const days = eachDayInclusive(t.checkIn, t.checkOut);
      if (days.some((d) => d.startsWith(prefix)) && !seen.has(t.leadId)) {
        seen.add(t.leadId);
        list.push(t);
      }
    }
    return list;
  }, [travelers, year, month]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="border-white/15 text-white bg-white/5 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-white font-bold text-lg capitalize min-w-[10rem] text-center">
            {monthLabel(cursor)}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="border-white/15 text-white bg-white/5 rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const n = new Date();
              setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
            }}
            className="border-white/15 text-white bg-white/5 rounded-xl"
          >
            Hoy
          </Button>
        </div>
        <p className="text-white/40 text-xs">
          {monthTravelers.length} viaje{monthTravelers.length !== 1 ? "s" : ""} en este mes
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1628] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/40">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((iso, idx) => {
            if (!iso) {
              return <div key={`e-${idx}`} className="min-h-[88px] border-b border-r border-white/5 bg-black/20" />;
            }
            const events = byDay.get(iso) ?? [];
            const isToday = iso === todayIso;
            return (
              <div
                key={iso}
                className={`min-h-[88px] border-b border-r border-white/5 p-1 ${
                  isToday ? "bg-teal/10" : "bg-transparent"
                }`}
              >
                <p
                  className={`text-[11px] font-bold mb-1 px-0.5 ${
                    isToday ? "text-teal" : "text-white/50"
                  }`}
                >
                  {Number(iso.slice(8))}
                </p>
                <div className="space-y-0.5">
                  {events.slice(0, 4).map((ev) => (
                    <button
                      key={`${ev.leadId}-${iso}`}
                      type="button"
                      title={`${ev.name} · ${ev.destino}\n${ev.checkIn} → ${ev.checkOut}`}
                      onClick={() => onSelectUser(ev.userId)}
                      className="w-full text-left rounded-md bg-teal/20 hover:bg-teal/35 border border-teal/30 px-1 py-0.5 transition-colors"
                    >
                      <p className="text-[10px] font-bold text-teal truncate leading-tight">{ev.name}</p>
                      <p className="text-[9px] text-white/70 truncate leading-tight">{ev.destino}</p>
                    </button>
                  ))}
                  {events.length > 4 ? (
                    <p className="text-[9px] text-white/40 px-0.5">+{events.length - 4} más</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {monthTravelers.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Viajeros del mes</p>
          <ul className="space-y-1.5">
            {monthTravelers.map((t) => (
              <li key={t.leadId}>
                <button
                  type="button"
                  onClick={() => onSelectUser(t.userId)}
                  className="w-full text-left rounded-xl border border-white/10 bg-black/20 hover:bg-black/40 px-3 py-2 transition-colors"
                >
                  <p className="text-white text-sm font-semibold">
                    {t.name}{" "}
                    <span className="text-white/40 font-normal">· {t.destino}</span>
                  </p>
                  <p className="text-teal text-xs">
                    {t.checkIn} → {t.checkOut}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
