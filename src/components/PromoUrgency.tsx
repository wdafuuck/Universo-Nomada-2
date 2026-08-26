"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type Props = {
  validUntil: string;
};

function parseEndDate(validUntil: string): Date {
  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  const match = validUntil.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (match) {
    const day = Number(match[1]);
    const month = months[match[2].toLowerCase()] ?? 11;
    const year = Number(match[3]);
    return new Date(year, month, day, 23, 59, 59);
  }
  // Formato corto tipo "30 ago" / "30 ago, 11:59 p. m." (año actual)
  const short = validUntil.match(/(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i);
  if (short) {
    const map: Record<string, number> = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
      jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
    };
    const day = Number(short[1]);
    const month = map[short[2]!.toLowerCase()] ?? 11;
    const year = new Date().getFullYear();
    return new Date(year, month, day, 23, 59, 59);
  }
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

/** Urgencia de promo: solo countdown. Sin “cupos” inventados. */
export function PromoUrgency({ validUntil }: Props) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const end = parseEndDate(validUntil);
    const tick = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Últimas horas");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      setRemaining(d > 0 ? `${d}d ${h}h` : `${h}h`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [validUntil]);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
        <Clock className="h-3 w-3" />
        Termina en {remaining}
      </span>
    </div>
  );
}
