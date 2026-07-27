"use client";

import { useEffect, useState } from "react";
import { Pencil, X, Save, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { EditableCartLine } from "@/lib/admin-lead-edit";
import { TripDocumentsEditor } from "@/components/admin/TripDocumentsEditor";
import { TripPaymentEditor } from "@/components/admin/TripPaymentEditor";
import { isTripLeadSource } from "@/lib/trip-documents";
import { checkOutFromCheckIn, parseTourDuration } from "@/lib/tour-duration";
import { computeBalanceDue, balancePaymentDeadline, formatDateCL } from "@/lib/reservation-payment";

const STATUSES = [
  { value: "nuevo", label: "Nuevo", color: "bg-blue-500/20 text-blue-300" },
  { value: "pendiente_transferencia", label: "Pend. transferencia", color: "bg-orange-500/20 text-orange-300" },
  { value: "contactado", label: "Contactado", color: "bg-amber-500/20 text-amber-300" },
  { value: "cotizado", label: "Cotizado", color: "bg-violet-500/20 text-violet-300" },
  { value: "reservado", label: "Reservado", color: "bg-teal/20 text-teal" },
  { value: "viajo", label: "Viajó", color: "bg-emerald-500/20 text-emerald-300" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-500/20 text-red-300" },
] as const;

type Lead = {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  destino: string | null;
  mensaje: string | null;
  status: string;
  source: string;
  referralCode: string | null;
  paymentMethod: string | null;
  paymentPlan: string | null;
  cartTotal: number | null;
  amountDue: number | null;
  expiresAt: string | null;
  tripEndDate: string | null;
  cartJson: string | null;
  createdAt: string;
};

type EditForm = {
  nombre: string;
  email: string;
  telefono: string;
  destino: string;
  status: string;
  cartTotal: string;
  amountDue: string;
  paymentMethod: string;
  paymentPlan: string;
  cartItems: EditableCartLine[];
};

function computedReturnDate(item: EditableCartLine): string {
  if (item.checkOut) return item.checkOut;
  if (item.checkIn && item.duration) return checkOutFromCheckIn(item.checkIn, item.duration);
  return "";
}

export function LeadsAdmin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"all" | "carrito" | "pendiente">("all");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [timeline, setTimeline] = useState<{
    notes: Array<{ id: number; body: string; createdAt: string; author?: { email: string } | null }>;
    events: Array<{ id: number; type: string; message: string; createdAt: string }>;
  }>({ notes: [], events: [] });
  const [savingNote, setSavingNote] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/leads", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setLeads(data.leads ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando leads");
    }
  };

  useEffect(() => { void load(); }, []);

  const PENDING_STATUSES = new Set(["nuevo", "contactado", "cotizado", "pendiente_transferencia"]);

  const filtered = filter === "carrito"
    ? leads.filter((l) => isTripLeadSource(l.source))
    : filter === "pendiente"
      ? leads.filter((l) => PENDING_STATUSES.has(l.status) && l.status !== "reservado")
      : leads;

  function buildLeadWhatsApp(lead: Lead): string {
    const msg = [
      `Hola ${lead.nombre.split(" ")[0]}! Soy de Universo Nómada.`,
      lead.destino ? `Vi tu interés en ${lead.destino}.` : "Vi tu solicitud de cotización.",
      "¿Te ayudo a armar tu viaje?",
    ].join(" ");
    const phone = lead.telefono.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  const openEdit = async (lead: Lead) => {
    setEditing(lead);
    setNoteDraft("");
    setTimeline({ notes: [], events: [] });
    let cartItems: EditableCartLine[] = [];
    const detailRes = await fetch(`/api/admin/leads/${lead.id}`, { credentials: "include" });
    if (detailRes.ok) {
      const data = await detailRes.json();
      if (isTripLeadSource(lead.source)) {
        cartItems = data.cartItems ?? [];
        for (const item of cartItems) {
          if (item.tourId && !item.duration) {
            const tourRes = await fetch(`/api/tours/${item.tourId}`, { credentials: "include" });
            if (tourRes.ok) {
              const tourData = await tourRes.json();
              item.duration = tourData.tour?.duration ?? item.duration;
            }
          }
          if (item.checkIn && item.duration && !item.checkOut) {
            item.checkOut = checkOutFromCheckIn(item.checkIn, item.duration);
          }
        }
      }
      setTimeline({
        notes: data.lead?.notes ?? [],
        events: data.lead?.events ?? [],
      });
    }
    setForm({
      nombre: lead.nombre,
      email: lead.email,
      telefono: lead.telefono,
      destino: lead.destino ?? "",
      status: lead.status,
      cartTotal: String(lead.cartTotal ?? 0),
      amountDue: String(lead.amountDue ?? 0),
      paymentMethod: lead.paymentMethod ?? "",
      paymentPlan: lead.paymentPlan ?? "",
      cartItems,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
    setNoteDraft("");
    setTimeline({ notes: [], events: [] });
  };

  const saveNote = async () => {
    if (!editing || !noteDraft.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/leads/${editing.id}/notes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setNoteDraft("");
      setTimeline((prev) => ({
        notes: [data.note, ...prev.notes],
        events: prev.events,
      }));
      toast.success("Nota guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la nota");
    } finally {
      setSavingNote(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("No se pudo actualizar");
      return;
    }
    toast.success("Estado actualizado");
    load();
  };

  const deleteLead = async (id: number) => {
    if (!window.confirm("¿Eliminar esta reserva? Se borrarán también sus documentos. Esta acción no se puede deshacer.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
      toast.success("Reserva eliminada");
      closeEdit();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !form) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        destino: form.destino,
        status: form.status,
        paymentMethod: form.paymentMethod || null,
        paymentPlan: form.paymentPlan || null,
      };
      // Total/abonos los gestiona TripPaymentEditor (ledger). No pisarlos al guardar el formulario.
      if (!isTripLeadSource(editing.source)) {
        payload.cartTotal = Number(form.cartTotal) || 0;
        payload.amountDue = Number(form.amountDue) || 0;
      }
      if (isTripLeadSource(editing.source) && form.cartItems.length) {
        payload.cartItems = form.cartItems;
      }

      const res = await fetch(`/api/admin/leads/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");

      toast.success("Viaje actualizado");
      closeEdit();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const updateCartItem = (idx: number, patch: Partial<EditableCartLine>) => {
    if (!form) return;
    const cartItems = [...form.cartItems];
    const next = { ...cartItems[idx], ...patch };
    if (next.checkIn && next.duration) {
      next.checkOut = checkOutFromCheckIn(next.checkIn, next.duration);
    }
    cartItems[idx] = next;
    setForm({ ...form, cartItems });
  };

  return (
    <>
      <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-white font-bold">Leads y reservas ({filtered.length})</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  window.open("/api/admin/leads/export", "_blank");
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white/80 hover:bg-white/15"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setFilter("pendiente")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === "pendiente" ? "bg-amber-500 text-[#070f1a]" : "bg-white/5 text-white/60"}`}
              >
                Sin comprar
              </button>
              <button
                type="button"
                onClick={() => setFilter("carrito")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === "carrito" ? "bg-teal text-[#070f1a]" : "bg-white/5 text-white/60"}`}
              >
                Reservas / viajes
              </button>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === "all" ? "bg-teal text-[#070f1a]" : "bg-white/5 text-white/60"}`}
              >
                Todos
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Pasajero", "Contacto", "Destino", "Pago", "Estado", "Fecha", ""].map((h) => (
                    <th key={h} className="text-left text-white/50 font-semibold pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const st = STATUSES.find((s) => s.value === lead.status) ?? STATUSES[0];
                  const total = lead.cartTotal ?? 0;
                  const paid = lead.amountDue ?? 0;
                  const balance = computeBalanceDue(total, paid);
                  const checkIn = lead.cartJson ? (() => {
                    try {
                      const parsed = JSON.parse(lead.cartJson);
                      return parsed?.items?.[0]?.checkIn ?? null;
                    } catch { return null; }
                  })() : null;
                  const deadline = balance > 0 ? balancePaymentDeadline(checkIn) : null;
                  return (
                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 align-top">
                      <td className="py-3 pr-3 text-white font-medium">{lead.nombre}</td>
                      <td className="py-3 pr-3">
                        <p className="text-teal">{lead.email}</p>
                        <p className="text-white/50 text-xs">{lead.telefono}</p>
                      </td>
                      <td className="py-3 pr-3 text-white/70 max-w-[140px]">{lead.destino || "—"}</td>
                      <td className="py-3 pr-3 text-white/50 text-xs">
                        {lead.paymentMethod || total > 0 ? (
                          <>
                            <p>{lead.paymentMethod ?? "—"} · {lead.paymentPlan ?? "—"}</p>
                            <p className="text-white/70">Total: ${total.toLocaleString("es-CL")}</p>
                            <p className="text-teal">Pagado: ${paid.toLocaleString("es-CL")}</p>
                            {balance > 0 && (
                              <p className="text-amber-300">
                                Saldo: ${balance.toLocaleString("es-CL")}
                                {deadline && (
                                  <span className="block text-white/40">Límite: {formatDateCL(deadline)}</span>
                                )}
                              </p>
                            )}
                          </>
                        ) : "—"}
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className={`rounded-lg px-2 py-1 text-xs font-bold border-0 ${st.color}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value} className="bg-slate-900 text-white">
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-3 text-white/50 text-xs whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString("es-CL")}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex gap-1">
                          {lead.telefono && PENDING_STATUSES.has(lead.status) && (
                            <a
                              href={buildLeadWhatsApp(lead)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#25D366] hover:text-[#128C7E] p-1"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => void openEdit(lead)}
                            className="text-teal hover:text-teal/80 p-1"
                            title="Editar viaje"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteLead(lead.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Eliminar reserva"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-white/40 text-center py-8">No hay registros</p>
            )}
          </div>
        </CardContent>
      </Card>

      {editing && form && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f1f35] border border-white/10 rounded-2xl shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/10 bg-[#0f1f35]">
              <div>
                <h3 className="text-white font-bold text-lg">Editar reserva #{editing.id}</h3>
                <p className="text-white/40 text-sm">{isTripLeadSource(editing.source) ? "Viaje de pasajero" : "Lead / cotización"}</p>
              </div>
              <button type="button" onClick={closeEdit} className="text-white/50 hover:text-white p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs">Nombre pasajero</label>
                  <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-white/40 text-xs">Email</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-white/40 text-xs">Teléfono</label>
                  <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-white/40 text-xs">Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm">
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-white/40 text-xs">Destino / paquete</label>
                  <Input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              {isTripLeadSource(editing.source) && (
                <>
                  <div className="pt-2 border-t border-white/10">
                    <TripPaymentEditor
                      leadId={editing.id}
                      onUpdated={() => {
                        void load();
                        void fetch(`/api/admin/leads`, { credentials: "include" })
                          .then((r) => r.json())
                          .then((data) => {
                            const refreshed = (data.leads ?? []).find((l: Lead) => l.id === editing.id);
                            if (refreshed) {
                              setEditing(refreshed);
                              setForm((prev) => prev ? {
                                ...prev,
                                cartTotal: String(refreshed.cartTotal ?? 0),
                                amountDue: String(refreshed.amountDue ?? 0),
                                status: refreshed.status,
                              } : prev);
                            }
                          })
                          .catch(() => {});
                      }}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <label className="text-white/40 text-xs">Método de pago</label>
                      <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                        className="mt-1 w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm">
                        <option value="">—</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="mercadopago">Mercado Pago</option>
                        <option value="sumup">SumUp</option>
                        <option value="admin">Admin / manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs">Regreso (automático)</label>
                      <Input
                        readOnly
                        value={form.cartItems[0] ? computedReturnDate(form.cartItems[0]) : ""}
                        className="mt-1 bg-white/5 border-white/10 text-white/60"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs">Plan de pago</label>
                      <select value={form.paymentPlan} onChange={(e) => setForm({ ...form, paymentPlan: e.target.value })}
                        className="mt-1 w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm">
                        <option value="total">Total</option>
                        <option value="deposito">Depósito</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" size="sm" variant="outline"
                        className="border-white/10 text-white bg-white/5 text-xs"
                        onClick={() => setForm({ ...form, status: "cancelado" })}
                      >
                        Marcar cancelado
                      </Button>
                    </div>
                  </div>

                  {form.cartItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-xl space-y-3 border border-white/10">
                      <p className="text-teal text-xs font-bold">Paquete {idx + 1}</p>
                      <Input placeholder="Nombre del tour" value={item.tourName}
                        onChange={(e) => updateCartItem(idx, { tourName: e.target.value })}
                        className="bg-white/5 border-white/10 text-white" />
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-white/40 text-xs">Inicio del viaje</label>
                          <Input type="date" value={item.checkIn ?? ""}
                            onChange={(e) => updateCartItem(idx, { checkIn: e.target.value })}
                            className="mt-1 bg-white/5 border-white/10 text-white" />
                        </div>
                        <div>
                          <label className="text-white/40 text-xs">Duración (ej. 5D/4N)</label>
                          <Input placeholder="5D/4N" value={item.duration ?? ""}
                            onChange={(e) => updateCartItem(idx, { duration: e.target.value })}
                            className="mt-1 bg-white/5 border-white/10 text-white" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-white/40 text-xs">
                            Regreso automático
                            {item.duration ? ` · ${parseTourDuration(item.duration).label}` : ""}
                          </label>
                          <Input readOnly value={computedReturnDate(item)}
                            className="mt-1 bg-white/5 border-white/10 text-white/60" />
                        </div>
                        <Input placeholder="Alojamiento" value={item.accommodationName ?? ""}
                          onChange={(e) => updateCartItem(idx, { accommodationName: e.target.value })}
                          className="bg-white/5 border-white/10 text-white" />
                        <Input placeholder="Habitación" value={item.roomLabel ?? ""}
                          onChange={(e) => updateCartItem(idx, { roomLabel: e.target.value })}
                          className="bg-white/5 border-white/10 text-white" />
                        <Input type="number" placeholder="Precio CLP" value={item.totalPrice}
                          onChange={(e) => updateCartItem(idx, { totalPrice: Number(e.target.value) || 0 })}
                          className="bg-white/5 border-white/10 text-white" />
                        <Input type="number" placeholder="Adultos" value={item.passengers?.adults ?? 2}
                          onChange={(e) => updateCartItem(idx, { passengers: { ...item.passengers, adults: Number(e.target.value) || 0 } })}
                          className="bg-white/5 border-white/10 text-white" />
                      </div>
                    </div>
                  ))}
                  <TripDocumentsEditor
                    leadId={editing.id}
                    customerEmail={editing.email}
                    customerName={editing.nombre}
                  />
                </>
              )}

              {!isTripLeadSource(editing.source) && editing.mensaje && (
                <div>
                  <label className="text-white/40 text-xs">Mensaje</label>
                  <Textarea value={editing.mensaje} readOnly className="mt-1 bg-white/5 border-white/10 text-white/60 min-h-[80px]" />
                </div>
              )}

              <div className="pt-2 border-t border-white/10 space-y-3">
                <label className="text-white/40 text-xs">Notas / timeline</label>
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Agregar nota interna…"
                  className="bg-white/5 border-white/10 text-white min-h-[70px]"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={savingNote || !noteDraft.trim()}
                  onClick={() => void saveNote()}
                  className="bg-white/10 text-white hover:bg-white/15"
                >
                  {savingNote ? "Guardando…" : "Agregar nota"}
                </Button>
                <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
                  {timeline.notes.map((n) => (
                    <div key={`n-${n.id}`} className="rounded-lg bg-white/5 border border-white/10 p-2 text-white/70">
                      <p>{n.body}</p>
                      <p className="text-white/35 mt-1">
                        {n.author?.email ?? "staff"} · {new Date(n.createdAt).toLocaleString("es-CL")}
                      </p>
                    </div>
                  ))}
                  {timeline.events.map((ev) => (
                    <div key={`e-${ev.id}`} className="text-white/45">
                      [{ev.type}] {ev.message} · {new Date(ev.createdAt).toLocaleString("es-CL")}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => void saveEdit()} disabled={saving}
                  className="bg-teal text-[#070f1a] font-bold rounded-xl">
                  <Save className="h-4 w-4 mr-1" /> {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button variant="outline" onClick={closeEdit}
                  className="border-white/10 text-white bg-white/5 rounded-xl">Cancelar</Button>
                <Button variant="outline" onClick={() => void deleteLead(editing.id)} disabled={deleting}
                  className="border-red-500/30 text-red-400 bg-red-500/10 rounded-xl ml-auto">
                  <Trash2 className="h-4 w-4 mr-1" /> {deleting ? "Eliminando..." : "Eliminar reserva"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
