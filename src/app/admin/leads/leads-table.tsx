"use client";

import { useState, useTransition } from "react";
import { LeadStatus, type Lead } from "@prisma/client";
import { toast } from "sonner";
import { MessageCircle, Mail, Phone, NotebookPen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { whatsappUrl, formatDateTime } from "@/lib/format";
import { updateLeadStatus, updateLeadNotes } from "./actions";

const STATUS_META: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  NEW: { label: "Nuevo", className: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  CONTACTED: {
    label: "Contactado",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  IN_PROGRESS: {
    label: "En proceso",
    className: "bg-violet-100 text-violet-800 border-violet-200",
  },
  CONVERTED: {
    label: "Convertido",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  LOST: { label: "Perdido", className: "bg-slate-200 text-slate-600 border-slate-300" },
};

export function LeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <p className="text-slate-500">No hay leads que coincidan con el filtro.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Recibido</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [statusPending, startStatusTransition] = useTransition();
  const [notesPending, startNotesTransition] = useTransition();

  function handleStatusChange(value: string) {
    startStatusTransition(async () => {
      const result = await updateLeadStatus(lead.id, value as LeadStatus);
      if ("error" in result) toast.error(result.error);
      else toast.success("Estado actualizado");
    });
  }

  function handleSaveNotes() {
    startNotesTransition(async () => {
      const result = await updateLeadNotes(lead.id, notes);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success("Nota guardada");
        setNotesOpen(false);
      }
    });
  }

  const wa = whatsappUrl(
    lead.telefono,
    `Hola ${lead.nombre.split(" ")[0]}, te contacto de Universo Nómada por tu consulta sobre ${lead.destino ?? "un viaje"}.`,
  );

  return (
    <>
      <TableRow className="align-top">
        <TableCell>
          <p className="font-semibold text-slate-900">{lead.nombre}</p>
          {lead.mensaje && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-xs">
              {lead.mensaje}
            </p>
          )}
        </TableCell>

        <TableCell>
          <div className="space-y-1 text-sm">
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 text-slate-700 hover:text-teal"
            >
              <Mail className="h-3.5 w-3.5" />
              {lead.email}
            </a>
            <a
              href={`tel:${lead.telefono}`}
              className="flex items-center gap-1.5 text-slate-700 hover:text-teal"
            >
              <Phone className="h-3.5 w-3.5" />
              {lead.telefono}
            </a>
          </div>
        </TableCell>

        <TableCell className="text-sm text-slate-700">
          {lead.destino ?? <span className="text-slate-400">—</span>}
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Select
              defaultValue={lead.status}
              onValueChange={handleStatusChange}
              disabled={statusPending}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_META) as [LeadStatus, typeof STATUS_META[LeadStatus]][])
                  .map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {statusPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            )}
          </div>
          {lead.contactedAt && lead.status !== "NEW" && (
            <p className="text-[10px] text-slate-400 mt-1">
              {formatDateTime(lead.contactedAt)}
            </p>
          )}
        </TableCell>

        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
          {formatDateTime(lead.createdAt)}
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <Button asChild size="sm" variant="ghost" className="h-8 px-2">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
              </a>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => setNotesOpen((v) => !v)}
              title="Nota interna"
            >
              <NotebookPen
                className={`h-4 w-4 ${lead.notes ? "text-amber-600" : "text-slate-400"}`}
              />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {notesOpen && (
        <TableRow className="bg-slate-50">
          <TableCell colSpan={6} className="py-3">
            <div className="space-y-2 max-w-2xl">
              <label className="text-xs font-semibold text-slate-600">
                Nota interna sobre {lead.nombre}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ej: prefiere viaje en pareja, presupuesto 1M, vuelve a llamar el viernes…"
                className="text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNotes(lead.notes ?? "");
                    setNotesOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={notesPending}
                >
                  {notesPending ? "Guardando…" : "Guardar nota"}
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}

export { STATUS_META };
