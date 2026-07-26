"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  Loader2,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MemberTrip } from "@/lib/member-trips";
import { BANK_TRANSFER } from "@/lib/bank-transfer";

type Payment = {
  id: number;
  amount: number;
  paidAt: string;
  method: string;
  note: string;
};

type Summary = {
  balanceDue: number;
  balancePaymentDeadline: string | null;
  balancePaymentDeadlineLabel: string | null;
  daysUntilBalanceDeadline: number | null;
  isFullyPaid: boolean;
};

type PanelData = {
  cartTotal: number;
  amountPaid: number;
  checkIn: string | null;
  status: string;
  payments: Payment[];
  summary: Summary;
};

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function toDateInput(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  leadId: number;
  onUpdated?: () => void;
};

export function TripPaymentEditor({ leadId, onUpdated }: Props) {
  const [data, setData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cartTotalInput, setCartTotalInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [paidAtInput, setPaidAtInput] = useState(() => toDateInput(new Date()));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTrip, setPreviewTrip] = useState<MemberTrip | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCustomer, setPreviewCustomer] = useState<{ name: string; email: string } | null>(null);

  const applyPayload = useCallback((payload: PanelData) => {
    setData(payload);
    setCartTotalInput(String(payload.cartTotal || ""));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/payments`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      applyPayload({
        cartTotal: json.cartTotal ?? 0,
        amountPaid: json.amountPaid ?? 0,
        checkIn: json.checkIn ?? null,
        status: json.status ?? "",
        payments: (json.payments ?? []).map((p: Payment & { paidAt: string }) => ({
          ...p,
          paidAt: typeof p.paidAt === "string" ? p.paidAt : String(p.paidAt),
        })),
        summary: json.summary,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando pagos");
    } finally {
      setLoading(false);
    }
  }, [leadId, applyPayload]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTotal = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/payments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_total",
          cartTotal: Number(String(cartTotalInput).replace(/\D/g, "")) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      applyPayload({
        cartTotal: json.cartTotal,
        amountPaid: json.amountPaid,
        checkIn: json.checkIn,
        status: json.status,
        payments: json.payments,
        summary: json.summary,
      });
      toast.success("Total del paquete actualizado");
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el total");
    } finally {
      setSaving(false);
    }
  };

  const addPayment = async () => {
    const amount = Number(String(amountInput).replace(/\D/g, "")) || 0;
    if (amount <= 0) {
      toast.error("Ingresa un monto de abono válido");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/payments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_payment",
          amount,
          note: noteInput.trim(),
          paidAt: paidAtInput || undefined,
          method: "transferencia",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      applyPayload({
        cartTotal: json.cartTotal,
        amountPaid: json.amountPaid,
        checkIn: json.checkIn,
        status: json.status,
        payments: json.payments,
        summary: json.summary,
      });
      setAmountInput("");
      setNoteInput("");
      setPaidAtInput(toDateInput(new Date()));
      toast.success(
        json.summary?.isFullyPaid
          ? "Abono registrado — viaje pagado completo"
          : "Abono registrado",
      );
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar el abono");
    } finally {
      setSaving(false);
    }
  };

  const removePayment = async (paymentId: number) => {
    if (!confirm("¿Eliminar este abono?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/payments/${paymentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      applyPayload({
        cartTotal: json.cartTotal,
        amountPaid: json.amountPaid,
        checkIn: json.checkIn,
        status: json.status,
        payments: json.payments,
        summary: json.summary,
      });
      toast.success("Abono eliminado");
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  };

  const openPreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewTrip(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/member-preview`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setPreviewTrip(json.trip);
      setPreviewCustomer(json.customer ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la vista previa");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center gap-2 text-white/50 text-sm py-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando pagos…
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="text-white font-semibold text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4 text-teal" />
          Pagos y abonos
        </h5>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void openPreview()}
          className="border-white/15 text-white bg-white/5 rounded-xl gap-1.5"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver como el cliente
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Total paquete</p>
          <p className="text-white font-bold text-lg mt-1">{formatCLP(data.cartTotal)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Abonado</p>
          <p className="text-teal font-bold text-lg mt-1">{formatCLP(data.amountPaid)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Saldo</p>
          {summary.isFullyPaid ? (
            <p className="text-emerald-400 font-bold text-lg mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Pagado completo
            </p>
          ) : (
            <p className="text-amber-300 font-bold text-lg mt-1">{formatCLP(summary.balanceDue)}</p>
          )}
        </div>
      </div>

      {!summary.isFullyPaid && summary.balancePaymentDeadlineLabel && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 flex gap-2">
          <CalendarClock className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p>
              El cliente debe pagar el saldo antes del{" "}
              <strong>{summary.balancePaymentDeadlineLabel}</strong>
              {" "}({BANK_TRANSFER.balanceDueWeeksBeforeTrip} semanas antes del viaje).
            </p>
            {!data.checkIn && (
              <p className="text-xs text-amber-200/80 mt-1">
                Sin fecha de check-in en el carrito no se calcula el plazo. Edita el viaje y agrega fecha.
              </p>
            )}
          </div>
        </div>
      )}

      {summary.isFullyPaid && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Viaje pagado completo — así lo verá el cliente en Mi cuenta.
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-white/50 block mb-1">Editar total del paquete (CLP)</label>
          <Input
            value={cartTotalInput}
            onChange={(e) => setCartTotalInput(e.target.value.replace(/[^\d]/g, ""))}
            className="bg-white/5 border-white/10 text-white rounded-xl"
            placeholder="947600"
          />
        </div>
        <Button
          type="button"
          onClick={() => void saveTotal()}
          disabled={saving}
          className="bg-teal text-[#070f1a] font-bold rounded-xl"
        >
          Guardar total
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Registrar abono</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <label className="text-xs text-white/50 block mb-1">Monto (CLP)</label>
            <Input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ""))}
              className="bg-white/5 border-white/10 text-white rounded-xl"
              placeholder="200000"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Fecha</label>
            <Input
              type="date"
              value={paidAtInput}
              onChange={(e) => setPaidAtInput(e.target.value)}
              className="bg-white/5 border-white/10 text-white rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Nota (opcional)</label>
            <Input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="bg-white/5 border-white/10 text-white rounded-xl"
              placeholder="Transferencia BCI…"
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={() => void addPayment()}
          disabled={saving}
          className="bg-teal text-[#070f1a] font-bold rounded-xl gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Agregar abono
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Historial de abonos</p>
        {data.payments.length === 0 ? (
          <p className="text-sm text-white/35">Aún no hay abonos registrados.</p>
        ) : (
          <ul className="space-y-2">
            {data.payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <div>
                  <p className="text-white font-medium text-sm">{formatCLP(p.amount)}</p>
                  <p className="text-white/40 text-xs">
                    {toDateInput(p.paidAt)}
                    {p.note ? ` · ${p.note}` : ""}
                    {p.method ? ` · ${p.method}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removePayment(p.id)}
                  disabled={saving}
                  className="text-red-300/80 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10"
                  aria-label="Eliminar abono"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa Mi cuenta"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 rounded-t-2xl">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-teal">Vista previa · Mi cuenta</p>
                <p className="text-sm text-slate-600">
                  {previewCustomer
                    ? `${previewCustomer.name} · ${previewCustomer.email}`
                    : "Cómo lo ve el cliente"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(false)}
                className="rounded-xl"
              >
                Cerrar
              </Button>
            </div>
            <div className="p-4">
              {previewLoading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                </div>
              )}
              {!previewLoading && previewTrip && (
                <MemberTripPreviewCard trip={previewTrip} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberTripPreviewCard({ trip }: { trip: MemberTrip }) {
  const showBalance = trip.balanceDue > 0 && trip.status !== "pendiente_transferencia";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal">Reserva #{trip.leadId}</p>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            {trip.destino ?? trip.items.map((i) => i.tourName).join(", ")}
          </h3>
          <p className="text-sm text-slate-500 mt-1 capitalize">
            Estado: {trip.status.replace(/_/g, " ")}
          </p>
        </div>
        <span className="shrink-0 rounded-full px-3 py-1 text-xs font-bold bg-teal/10 text-teal">
          {trip.isPast ? "Realizado" : "Programado"}
        </span>
      </div>

      {showBalance && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
          <p className="font-bold text-amber-900 flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Saldo pendiente: {formatCLP(trip.balanceDue)}
          </p>
          {trip.balancePaymentDeadlineLabel && (
            <p className="text-sm text-amber-800">
              Fecha máxima de pago: <strong>{trip.balancePaymentDeadlineLabel}</strong>
              {trip.daysUntilBalanceDeadline != null && trip.daysUntilBalanceDeadline >= 0 && (
                <span className="block mt-0.5">
                  {trip.daysUntilBalanceDeadline === 0
                    ? "Vence hoy"
                    : `Faltan ${trip.daysUntilBalanceDeadline} día${trip.daysUntilBalanceDeadline !== 1 ? "s" : ""}`}
                </span>
              )}
            </p>
          )}
          <p className="text-xs text-amber-700">
            Pagado hasta ahora: {formatCLP(trip.amountPaid)} de {formatCLP(trip.cartTotal)}
          </p>
        </div>
      )}

      {trip.isFullyPaid && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Viaje pagado completo
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm border-t border-slate-100 pt-4">
        <span>
          Total reserva: <strong>{formatCLP(trip.cartTotal)}</strong>
        </span>
        {trip.balanceDue > 0 && (
          <span className="text-amber-700">
            Saldo pendiente: <strong>{formatCLP(trip.balanceDue)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
