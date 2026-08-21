"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, User, Plane, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TripDocumentsEditor } from "@/components/admin/TripDocumentsEditor";
import { TripPaymentEditor } from "@/components/admin/TripPaymentEditor";
import type { EditableCartLine } from "@/lib/admin-lead-edit";
import { checkOutFromCheckIn, parseTourDuration } from "@/lib/tour-duration";

type UserTrip = {
  id: number;
  destino: string | null;
  status: string;
  source: string;
  email: string;
  cartTotal: number | null;
  amountDue: number | null;
  tripEndDate: string | null;
  createdAt: string;
  _count: { documents: number };
};

type RegisteredUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  leads: UserTrip[];
};

const STATUSES = [
  { value: "reservado", label: "Reservado" },
  { value: "viajo", label: "Viajó" },
  { value: "contactado", label: "Contactado" },
  { value: "cotizado", label: "Cotizado" },
  { value: "pendiente_transferencia", label: "Pend. transferencia" },
];

const emptyCartLine = (): EditableCartLine => ({
  tourName: "",
  checkIn: "",
  checkOut: "",
  duration: "5D/4N",
  accommodationName: "",
  roomLabel: "",
  totalPrice: 0,
  passengers: { adults: 2, children: 0, infants: 0 },
});

export function MembersAdmin() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RegisteredUser | null>(null);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });

  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    telefono: "+56",
    withTrip: true,
    destino: "",
    status: "reservado",
    cartTotal: "",
    cartItems: [emptyCartLine()],
  });

  const [tripForm, setTripForm] = useState({
    destino: "",
    status: "reservado",
    cartTotal: "",
    amountDue: "",
    cartItems: [emptyCartLine()],
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      const nextUsers = (data.users ?? []) as RegisteredUser[];
      setUsers(nextUsers);
      setSelected((prev) => {
        if (!prev) return prev;
        return nextUsers.find((u) => u.id === prev.id) ?? prev;
      });
      return nextUsers;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando clientes");
      return [] as RegisteredUser[];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openNewClient = () => {
    setShowNewClient(true);
    setShowNewTrip(false);
    setSelected(null);
    setEditingTripId(null);
    setClientForm({
      name: "",
      email: "",
      telefono: "+56",
      withTrip: true,
      destino: "",
      status: "reservado",
      cartTotal: "",
      cartItems: [emptyCartLine()],
    });
  };

  const updateClientCartItem = (idx: number, patch: Partial<EditableCartLine>) => {
    const cartItems = [...clientForm.cartItems];
    const next = { ...cartItems[idx], ...patch };
    if (next.checkIn && next.duration) {
      next.checkOut = checkOutFromCheckIn(next.checkIn, next.duration);
    }
    cartItems[idx] = next;
    setClientForm({ ...clientForm, cartItems });
  };

  const saveNewClient = async () => {
    if (!clientForm.name.trim()) {
      toast.error("Indica el nombre del cliente");
      return;
    }
    if (!clientForm.email.trim()) {
      toast.error("Indica el correo del cliente");
      return;
    }
    if (clientForm.withTrip && !clientForm.cartItems[0]?.tourName?.trim()) {
      toast.error("Indica el nombre del paquete del viaje");
      return;
    }

    setSaving(true);
    try {
      const item = clientForm.cartItems[0];
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          telefono: clientForm.telefono.trim() || "+56",
          ...(clientForm.withTrip
            ? {
                trip: {
                  destino: clientForm.destino || item.tourName,
                  status: clientForm.status,
                  cartTotal: Number(clientForm.cartTotal) || item.totalPrice,
                  cartItems: clientForm.cartItems,
                },
              }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");

      toast.success(clientForm.withTrip ? "Cliente y viaje creados" : "Cliente creado");
      setShowNewClient(false);
      await load();
      const usersRes = await fetch("/api/admin/users", { credentials: "include" });
      const usersData = await usersRes.json();
      const fresh = (usersData.users ?? []).find((u: RegisteredUser) => u.id === data.user?.id);
      if (fresh) setSelected(fresh);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const openEditProfile = (user: RegisteredUser) => {
    setEditingProfile(true);
    setShowNewTrip(false);
    setProfileForm({ name: user.name ?? "", email: user.email });
  };

  const saveProfile = async () => {
    if (!selected) return;
    if (!profileForm.email.trim()) {
      toast.error("Indica el correo");
      return;
    }
    const emailChanged =
      profileForm.email.trim().toLowerCase() !== selected.email.toLowerCase();
    if (emailChanged) {
      const other = users.find(
        (u) =>
          u.id !== selected.id &&
          u.email.toLowerCase() === profileForm.email.trim().toLowerCase(),
      );
      if (other) {
        const ok = confirm(
          `Ya existe otro cliente con ${profileForm.email.trim()}.\n\n` +
            `Se unirán todos los viajes e información en una sola cuenta (${selected.name || selected.email}).\n\n` +
            `¿Continuar?`,
        );
        if (!ok) return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selected.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");

      if (data.merged) {
        toast.success(
          `Correo actualizado y cuentas unificadas${data.mergedFromEmail ? ` (se absorbió ${data.mergedFromEmail})` : ""}`,
        );
      } else {
        toast.success("Datos del cliente actualizados (también en sus viajes)");
      }
      setEditingProfile(false);
      const next = await load();
      const fresh = next.find((u) => u.id === selected.id);
      if (fresh) setSelected(fresh);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const openNewTrip = (user: RegisteredUser) => {
    setSelected(user);
    setShowNewTrip(true);
    setEditingTripId(null);
    setEditingProfile(false);
    setTripForm({
      destino: "",
      status: "reservado",
      cartTotal: "",
      amountDue: "",
      cartItems: [emptyCartLine()],
    });
  };

  const saveNewTrip = async () => {
    if (!selected) return;
    const item = tripForm.cartItems[0];
    if (!item.tourName.trim()) {
      toast.error("Indica el nombre del paquete");
      return;
    }

    setSaving(true);
    try {
      const createRes = await fetch("/api/admin/leads", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          nombre: selected.name || selected.email.split("@")[0],
          email: selected.email,
          telefono: "+56",
          destino: tripForm.destino || item.tourName,
          status: tripForm.status,
          cartTotal: Number(tripForm.cartTotal) || item.totalPrice,
          amountDue: Number(tripForm.amountDue) || 0,
          cartItems: tripForm.cartItems,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error ?? "Error");

      toast.success("Viaje agregado al cliente");
      setShowNewTrip(false);
      await load();
      const usersRes = await fetch("/api/admin/users", { credentials: "include" });
      const usersData = await usersRes.json();
      const fresh = (usersData.users ?? []).find((u: RegisteredUser) => u.id === selected.id);
      if (fresh) setSelected(fresh);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const updateCartItem = (idx: number, patch: Partial<EditableCartLine>) => {
    const cartItems = [...tripForm.cartItems];
    const next = { ...cartItems[idx], ...patch };
    if (next.checkIn && next.duration) {
      next.checkOut = checkOutFromCheckIn(next.checkIn, next.duration);
    }
    cartItems[idx] = next;
    setTripForm({ ...tripForm, cartItems });
  };

  if (loading) {
    return <p className="text-white/40 py-12 text-center">Cargando clientes registrados...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-teal" /> Clientes ({users.length})
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Registrados en la web o creados manualmente. Gestiona viajes y documentos.
          </p>
        </div>
        <Button
          onClick={openNewClient}
          className="bg-teal text-[#070f1a] font-bold rounded-xl shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" /> Agregar cliente manual
        </Button>
      </div>

      {showNewClient && (
        <div className="rounded-2xl border border-teal/30 bg-teal/5 p-5 space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-teal" /> Nuevo cliente manual
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs">Nombre completo</label>
              <Input
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                placeholder="María González"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs">Correo (para Mi cuenta)</label>
              <Input
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                placeholder="cliente@email.com"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/40 text-xs">Teléfono / WhatsApp</label>
              <Input
                value={clientForm.telefono}
                onChange={(e) => setClientForm({ ...clientForm, telefono: e.target.value })}
                placeholder="+56912345678"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={clientForm.withTrip}
              onChange={(e) => setClientForm({ ...clientForm, withTrip: e.target.checked })}
              className="rounded border-white/20"
            />
            Crear primer viaje ahora
          </label>

          {clientForm.withTrip && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
              <h4 className="text-white font-semibold flex items-center gap-2 text-sm">
                <Plane className="h-4 w-4 text-teal" /> Datos del viaje
              </h4>
              <Input
                placeholder="Nombre del paquete / destino"
                value={clientForm.cartItems[0]?.tourName ?? ""}
                onChange={(e) => updateClientCartItem(0, { tourName: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <div className="grid sm:grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={clientForm.cartItems[0]?.checkIn ?? ""}
                  onChange={(e) => updateClientCartItem(0, { checkIn: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  placeholder="Duración (5D/4N)"
                  value={clientForm.cartItems[0]?.duration ?? ""}
                  onChange={(e) => updateClientCartItem(0, { duration: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                {clientForm.cartItems[0]?.checkIn && clientForm.cartItems[0]?.duration && (
                  <p className="sm:col-span-2 text-xs text-white/50">
                    Regreso:{" "}
                    {checkOutFromCheckIn(clientForm.cartItems[0].checkIn!, clientForm.cartItems[0].duration!)}
                    {" · "}
                    {parseTourDuration(clientForm.cartItems[0].duration).label}
                  </p>
                )}
                <Input
                  type="number"
                  placeholder="Total CLP"
                  value={clientForm.cartTotal || clientForm.cartItems[0]?.totalPrice || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setClientForm({ ...clientForm, cartTotal: v });
                    updateClientCartItem(0, { totalPrice: Number(v) || 0 });
                  }}
                  className="bg-white/5 border-white/10 text-white"
                />
                <select
                  value={clientForm.status}
                  onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}
                  className="rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void saveNewClient()}
              disabled={saving}
              className="bg-teal text-[#070f1a] font-bold rounded-xl"
            >
              {saving ? "Guardando..." : clientForm.withTrip ? "Crear cliente y viaje" : "Crear cliente"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNewClient(false)}
              className="border-white/10 text-white bg-white/5 rounded-xl"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {users.length === 0 && !showNewClient ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center space-y-4">
          <p className="text-white/40">Aún no hay clientes. Puedes agregar uno manualmente.</p>
          <Button onClick={openNewClient} className="bg-teal text-[#070f1a] font-bold rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Agregar primer cliente
          </Button>
        </div>
      ) : users.length > 0 ? (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setSelected(user);
                  setShowNewTrip(false);
                  setShowNewClient(false);
                  setEditingTripId(null);
                  setEditingProfile(false);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected?.id === user.id
                    ? "border-teal/50 bg-teal/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="text-white font-semibold">{user.name || "Sin nombre"}</p>
                <p className="text-teal text-sm truncate">{user.email}</p>
                <p className="text-white/40 text-xs mt-1">
                  Registro: {new Date(user.createdAt).toLocaleDateString("es-CL")}
                  · {user.leads.length} viaje{user.leads.length !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {!selected ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/40">
                Selecciona un cliente para ver sus viajes
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#0f1f35] p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-teal text-xs font-bold uppercase">Cliente</p>
                    <h3 className="text-white font-bold text-lg">{selected.name || selected.email}</h3>
                    <p className="text-white/50 text-sm">{selected.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openEditProfile(selected)}
                      className="border-white/10 text-white bg-white/5 rounded-xl"
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Cambiar correo
                    </Button>
                    <Button
                      onClick={() => openNewTrip(selected)}
                      className="bg-teal text-[#070f1a] font-bold rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Agregar viaje manual
                    </Button>
                  </div>
                </div>

                {editingProfile && (
                  <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-3">
                    <h4 className="text-white font-semibold text-sm">Editar nombre y correo</h4>
                    <p className="text-white/40 text-xs">
                      Al cambiar el correo se actualiza también en todos sus viajes. Si ya existe otra cuenta con ese correo, se unen en una sola.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/40 text-xs">Nombre</label>
                        <Input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/40 text-xs">Correo</label>
                        <Input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="mt-1 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void saveProfile()}
                        disabled={saving}
                        className="bg-teal text-[#070f1a] font-bold rounded-xl"
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingProfile(false)}
                        className="border-white/10 text-white bg-white/5 rounded-xl"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {showNewTrip && (
                  <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-3">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      <Plane className="h-4 w-4 text-teal" /> Nuevo viaje (no comprado en web)
                    </h4>
                    <Input
                      placeholder="Nombre del paquete / destino"
                      value={tripForm.cartItems[0]?.tourName ?? ""}
                      onChange={(e) => updateCartItem(0, { tourName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input type="date" placeholder="Inicio"
                        value={tripForm.cartItems[0]?.checkIn ?? ""}
                        onChange={(e) => updateCartItem(0, { checkIn: e.target.value })}
                        className="bg-white/5 border-white/10 text-white" />
                      <Input placeholder="Duración (5D/4N)"
                        value={tripForm.cartItems[0]?.duration ?? ""}
                        onChange={(e) => updateCartItem(0, { duration: e.target.value })}
                        className="bg-white/5 border-white/10 text-white" />
                      {tripForm.cartItems[0]?.checkIn && tripForm.cartItems[0]?.duration && (
                        <p className="sm:col-span-2 text-xs text-white/50">
                          Regreso: {checkOutFromCheckIn(tripForm.cartItems[0].checkIn!, tripForm.cartItems[0].duration!)}
                          {" · "}{parseTourDuration(tripForm.cartItems[0].duration).label}
                        </p>
                      )}
                      <Input type="number" placeholder="Total CLP"
                        value={tripForm.cartTotal || tripForm.cartItems[0]?.totalPrice || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTripForm({ ...tripForm, cartTotal: v });
                          updateCartItem(0, { totalPrice: Number(v) || 0 });
                        }}
                        className="bg-white/5 border-white/10 text-white" />
                      <select value={tripForm.status}
                        onChange={(e) => setTripForm({ ...tripForm, status: e.target.value })}
                        className="rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm">
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => void saveNewTrip()} disabled={saving}
                        className="bg-teal text-[#070f1a] font-bold rounded-xl">
                        {saving ? "Guardando..." : "Crear viaje"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewTrip(false)}
                        className="border-white/10 text-white bg-white/5 rounded-xl">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-white/70 text-sm font-semibold">Viajes del cliente</h4>
                  {selected.leads.length === 0 ? (
                    <p className="text-white/30 text-sm">Sin viajes registrados. Agrega uno manualmente.</p>
                  ) : (
                    selected.leads.map((trip) => (
                      <div key={trip.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="flex items-center justify-between gap-3 p-4">
                          <div>
                            <p className="text-white font-medium">
                              #{trip.id} · {trip.destino || "Sin destino"}
                            </p>
                            <p className="text-white/40 text-xs mt-0.5 capitalize">
                              {trip.status.replace(/_/g, " ")} · {trip.source === "admin-manual" ? "Manual" : "Web"}
                              {trip.email && trip.email.toLowerCase() !== selected.email.toLowerCase()
                                ? ` · ⚠ viaje: ${trip.email}`
                                : ""}
                              {trip.cartTotal ? ` · Total $${trip.cartTotal.toLocaleString("es-CL")}` : ""}
                              {trip.cartTotal != null && trip.amountDue != null && trip.cartTotal > 0 && (
                                trip.amountDue >= trip.cartTotal
                                  ? " · Pagado completo"
                                  : ` · Saldo $${Math.max(0, trip.cartTotal - trip.amountDue).toLocaleString("es-CL")}`
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40 flex items-center gap-1">
                              <FileText className="h-3 w-3" /> {trip._count.documents}
                            </span>
                            <button
                              type="button"
                              title="Editar pagos y documentos"
                              onClick={() => setEditingTripId(editingTripId === trip.id ? null : trip.id)}
                              className="text-teal p-2 hover:bg-teal/10 rounded-lg"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {editingTripId === trip.id && (
                          <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-6">
                            <TripPaymentEditor
                              leadId={trip.id}
                              onUpdated={() => { void load(); }}
                            />
                            <TripDocumentsEditor
                              leadId={trip.id}
                              customerEmail={selected.email}
                              customerName={selected.name ?? undefined}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
