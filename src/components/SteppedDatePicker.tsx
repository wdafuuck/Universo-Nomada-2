"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function parseIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatDateEs(isoDate: string): string {
  const parsed = parseIso(isoDate);
  if (!parsed) return isoDate;
  return parsed.toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type Step = "year" | "month" | "day";

type Props = {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  minDate?: string | Date;
  maxDate?: string | Date;
  active?: boolean;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function asDate(input?: string | Date): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return startOfDay(input);
  return parseIso(input);
}

export function SteppedDatePicker({
  value,
  onChange,
  label,
  placeholder = "Selecciona fecha",
  minYear,
  maxYear,
  minDate,
  maxDate,
  active = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("year");
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  const [pickedMonth, setPickedMonth] = useState<number | null>(null);

  const min = asDate(minDate);
  const max = asDate(maxDate);
  const today = useMemo(() => startOfDay(new Date()), []);
  const yearFrom = minYear ?? (min?.getFullYear() ?? today.getFullYear() - 100);
  const yearTo = maxYear ?? (max?.getFullYear() ?? today.getFullYear() + 15);

  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  useEffect(() => {
    if (open) {
      setStep("year");
      setPickedYear(null);
      setPickedMonth(null);
    }
  }, [open]);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = yearTo; y >= yearFrom; y--) list.push(y);
    return list;
  }, [yearFrom, yearTo]);

  const isDayAllowed = (y: number, m: number, d: number) => {
    const date = startOfDay(new Date(y, m - 1, d));
    if (min && date < min) return false;
    if (max && date > max) return false;
    return true;
  };

  const isMonthAllowed = (y: number, m: number) => {
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      if (isDayAllowed(y, m, d)) return true;
    }
    return false;
  };

  const isYearAllowed = (y: number) => {
    for (let m = 1; m <= 12; m++) {
      if (isMonthAllowed(y, m)) return true;
    }
    return false;
  };

  const daysInPickedMonth = useMemo(() => {
    if (pickedYear == null || pickedMonth == null) return [];
    const count = new Date(pickedYear, pickedMonth, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [pickedYear, pickedMonth]);

  const handleDay = (day: number) => {
    if (pickedYear == null || pickedMonth == null) return;
    if (!isDayAllowed(pickedYear, pickedMonth, day)) return;
    onChange(toIso(pickedYear, pickedMonth, day));
    setOpen(false);
  };

  const stepTitle = step === "year"
    ? "Elige el año"
    : step === "month"
      ? `Elige el mes · ${pickedYear}`
      : `${MONTHS[(pickedMonth ?? 1) - 1]} ${pickedYear}`;

  return (
    <div>
      {label && <label className="text-xs text-slate-500">{label}</label>}
      <button
        type="button"
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
        <span className="truncate text-sm">
          {value ? formatDateEs(value) : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && active && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            {step !== "year" && (
              <button
                type="button"
                onClick={() => {
                  if (step === "day") setStep("month");
                  else if (step === "month") setStep("year");
                }}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-600"
                aria-label="Volver"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <p className="text-sm font-semibold text-slate-900 flex-1">{stepTitle}</p>
          </div>

          {step === "year" && (
            <div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
              {years.map((y) => {
                const allowed = isYearAllowed(y);
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={!allowed}
                    onClick={() => {
                      setPickedYear(y);
                      setStep("month");
                    }}
                    className={cn(
                      "h-10 rounded-lg text-sm font-medium transition-colors",
                      allowed
                        ? "hover:bg-teal/10 hover:text-teal text-slate-800"
                        : "text-slate-300 cursor-not-allowed",
                      value.startsWith(String(y)) && "bg-teal/15 text-teal",
                    )}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {step === "month" && pickedYear != null && (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((name, idx) => {
                const m = idx + 1;
                const allowed = isMonthAllowed(pickedYear, m);
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={!allowed}
                    onClick={() => {
                      setPickedMonth(m);
                      setStep("day");
                    }}
                    className={cn(
                      "h-10 rounded-lg text-xs font-medium transition-colors px-1",
                      allowed
                        ? "hover:bg-teal/10 hover:text-teal text-slate-800"
                        : "text-slate-300 cursor-not-allowed",
                    )}
                  >
                    {name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}

          {step === "day" && pickedYear != null && pickedMonth != null && (
            <div className="grid grid-cols-7 gap-1">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <span key={`${d}-${i}`} className="text-[10px] text-center text-slate-400 font-medium py-1">
                  {d}
                </span>
              ))}
              {(() => {
                const firstDow = (new Date(pickedYear, pickedMonth - 1, 1).getDay() + 6) % 7;
                const blanks = Array.from({ length: firstDow });
                return (
                  <>
                    {blanks.map((_, i) => <span key={`b-${i}`} />)}
                    {daysInPickedMonth.map((day) => {
                      const allowed = isDayAllowed(pickedYear, pickedMonth, day);
                      const iso = toIso(pickedYear, pickedMonth, day);
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={!allowed}
                          onClick={() => handleDay(day)}
                          className={cn(
                            "h-8 rounded-md text-sm font-medium transition-colors",
                            allowed
                              ? "hover:bg-teal hover:text-white text-slate-800"
                              : "text-slate-300 cursor-not-allowed",
                            value === iso && "bg-teal text-white",
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
