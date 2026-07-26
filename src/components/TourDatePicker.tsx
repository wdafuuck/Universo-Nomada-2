"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function parseIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateEs(isoDate: string): string {
  const parsed = parseIso(isoDate);
  if (!parsed) return isoDate;
  return parsed.toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

type Props = {
  tourId: string;
  value: string;
  onChange: (iso: string) => void;
  adults: number;
  validating?: boolean;
  label?: string;
  placeholder?: string;
  allowedDatesHint?: string;
  active?: boolean;
  /** Si false, no filtra fechas por tope de vuelo Travelpayouts (todas las futuras habilitadas). */
  filterByFlightBudget?: boolean;
};

export function TourDatePicker({
  tourId,
  value,
  onChange,
  adults,
  validating,
  label,
  placeholder = "Selecciona fecha de ida",
  allowedDatesHint,
  active = true,
  filterByFlightBudget = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = parseIso(value) ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [allowedDates, setAllowedDates] = useState<string[]>([]);
  const [hasBudget, setHasBudget] = useState<boolean | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");

  const monthKey = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const d = parseIso(value) ?? new Date();
    setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [open, value]);

  useEffect(() => {
    if (!active || !tourId) return;
    if (!filterByFlightBudget) {
      setAllowedDates([]);
      setHasBudget(false);
      setFetchMessage("");
      setLoadingMonth(false);
      return;
    }
    let cancelled = false;
    setLoadingMonth(true);
    fetch(
      `/api/flights/allowed-dates?tourId=${encodeURIComponent(tourId)}&month=${monthKey}&adults=${adults}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setAllowedDates(data.allowed ?? []);
        setHasBudget(!!data.hasBudget);
        setFetchMessage(data.message ?? "");
      })
      .catch(() => {
        if (!cancelled) {
          setAllowedDates([]);
          setHasBudget(false);
          setFetchMessage("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMonth(false);
      });
    return () => { cancelled = true; };
  }, [tourId, monthKey, adults, active, filterByFlightBudget]);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const disabledMatcher = useCallback(
    (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      if (d < today) return true;
      if (hasBudget === null || loadingMonth) return true;
      if (hasBudget) {
        if (allowedDates.length === 0) return true;
        return !allowedDates.includes(toIso(d));
      }
      return false;
    },
    [today, hasBudget, allowedDates, loadingMonth],
  );

  const selected = parseIso(value);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(toIso(date));
    setOpen(false);
  };

  return (
    <div>
      {label && <label className="text-xs text-slate-500">{label}</label>}
      <button
        type="button"
        disabled={validating}
        onClick={() => active && setOpen((o) => !o)}
        className={cn(
          "mt-1 w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200",
          "bg-white px-3 h-11 text-left text-sm transition-colors",
          "hover:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/30",
          !value && "text-slate-400",
          value && "text-slate-900 font-medium",
          open && "border-teal ring-2 ring-teal/30",
        )}
      >
        <span className="truncate">
          {value ? formatDateEs(value) : placeholder}
        </span>
        {validating || (hasBudget && loadingMonth) ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal" />
        ) : (
          <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {open && active && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm relative">
          {loadingMonth && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
              <Loader2 className="h-5 w-5 animate-spin text-teal" />
            </div>
          )}
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            disabled={disabledMatcher}
            locale={es}
            fixedWeeks
            className="rounded-lg"
          />
        </div>
      )}

      {hasBudget && allowedDates.length > 0 && allowedDatesHint && open && (
        <p className="text-xs text-teal mt-2">
          {allowedDatesHint}:{" "}
          {allowedDates.slice(0, 6).map(formatDateEs).join(", ")}
          {allowedDates.length > 6 ? "…" : ""}
        </p>
      )}

      {hasBudget && !loadingMonth && allowedDates.length === 0 && open && (
        <p className="text-xs text-amber-700 mt-2 leading-relaxed">
          {fetchMessage ||
            "Este mes aún no muestra fechas en el sistema. Elige otro mes o déjanos tu fecha preferida en el siguiente paso."}
        </p>
      )}
    </div>
  );
}

export { formatDateEs as formatTourDateEs, toIso as dateToIso, parseIso as parseTourDate };
