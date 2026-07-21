"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

type Props = {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  className?: string;
};

export function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function AdminReorderControls({ index, total, onMove, className }: Props) {
  return (
    <div className={`flex flex-col gap-0.5 shrink-0 ${className ?? ""}`}>
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none"
        title="Subir"
        aria-label="Subir"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(index, index + 1)}
        className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none"
        title="Bajar"
        aria-label="Bajar"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  );
}
