"use client";

import { Download } from "lucide-react";
import { type Lead } from "@prisma/client";
import { Button } from "@/components/ui/button";

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  return /[",\n\r]/.test(str) ? `"${str}"` : str;
}

export function CsvExportButton({ leads }: { leads: Lead[] }) {
  function handleClick() {
    const header = [
      "id",
      "nombre",
      "email",
      "telefono",
      "destino",
      "mensaje",
      "status",
      "notes",
      "contactedAt",
      "createdAt",
    ];
    const rows = leads.map((l) => [
      l.id,
      l.nombre,
      l.email,
      l.telefono,
      l.destino,
      l.mensaje,
      l.status,
      l.notes,
      l.contactedAt ? new Date(l.contactedAt).toISOString() : "",
      new Date(l.createdAt).toISOString(),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-universo-nomada-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={leads.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  );
}
