"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEPARTURE_AVAILABILITY_OPTIONS,
  type DepartureAvailability,
  normalizeDepartureAvailability,
} from "@/lib/group-departure-availability";

type Departure = {
  id?: number;
  date: string;
  availabilityStatus: DepartureAvailability;
  spotsLeft?: number;
  totalSpots?: number;
};

type Trip = {
  id: number;
  tourId: string;
  name: string;
  duration: string;
  image: string;
  gradient: string;
  reservation: number;
  price: number;
  includesJson: string;
  active: boolean;
  departures: Departure[];
};

function mapDepartures(raw: Departure[]): Departure[] {
  return raw.map((d) => ({
    ...d,
    availabilityStatus: normalizeDepartureAvailability(d.availabilityStatus, d.spotsLeft),
  }));
}

export function GroupTripsAdmin() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = () => {
    fetch("/api/admin/group-trips", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        const trips = (d.trips ?? []).map((t: Trip) => ({
          ...t,
          departures: mapDepartures(t.departures ?? []),
        }));
        setTrips(trips);
      })
      .catch(() => toast.error("No se pudieron cargar los viajes grupales. Recarga la página."));
  };

  useEffect(() => { load(); }, []);

  const toggleVisibility = async (trip: Trip) => {
    setTogglingId(trip.id);
    try {
      const res = await fetch(`/api/admin/group-trips/${trip.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !trip.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(trip.active ? `${trip.name} oculto en la web` : `${trip.name} visible en la web`);
      load();
    } catch {
      toast.error("No se pudo cambiar la visibilidad");
    } finally {
      setTogglingId(null);
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const body = {
        name: editing.name,
        duration: editing.duration,
        image: editing.image,
        gradient: editing.gradient,
        reservation: editing.reservation,
        price: editing.price,
        active: editing.active,
        includes: JSON.parse(editing.includesJson || "[]"),
        departures: editing.departures.map(({ date, availabilityStatus }) => ({
          date,
          availabilityStatus,
        })),
      };
      const res = await fetch(`/api/admin/group-trips/${editing.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success("Viaje grupal actualizado");
      setEditing(null);
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const updateDeparture = (i: number, patch: Partial<Departure>) => {
    if (!editing) return;
    const deps = [...editing.departures];
    deps[i] = { ...deps[i], ...patch };
    setEditing({ ...editing, departures: deps });
  };

  const addDeparture = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      departures: [
        ...editing.departures,
        { date: "", availabilityStatus: "available" },
      ],
    });
  };

  const removeDeparture = (i: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      departures: editing.departures.filter((_, idx) => idx !== i),
    });
  };

  const visibleCount = trips.filter((t) => t.active).length;

  if (editing) {
    return (
      <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-white font-bold">Editar: {editing.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Nombre" />
            <Input value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Duración" />
            <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white" placeholder="Precio" />
            <Input type="number" value={editing.reservation} onChange={(e) => setEditing({ ...editing, reservation: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white" placeholder="Reserva" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-white/50 text-sm">Salidas y estado de cupos</p>
              <Button type="button" size="sm" variant="outline" onClick={addDeparture} className="border-white/20 text-white bg-white/5 h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> Salida
              </Button>
            </div>
            {editing.departures.map((dep, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
                <Input
                  value={dep.date}
                  onChange={(e) => updateDeparture(i, { date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Ej: Del 14 al 18 de agosto"
                />
                <select
                  value={dep.availabilityStatus}
                  onChange={(e) =>
                    updateDeparture(i, {
                      availabilityStatus: e.target.value as DepartureAvailability,
                    })
                  }
                  className="rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm min-w-[200px]"
                >
                  {DEPARTURE_AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeDeparture(i)}
                  className="text-red-400 p-2 justify-self-end"
                  aria-label="Eliminar salida"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="bg-teal text-[#070f1a] font-bold">
              <Save className="h-4 w-4 mr-2" /> Guardar
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} className="border-white/20 text-white">Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-white/50 text-sm">
        {visibleCount === 0
          ? "Todos los viajes están ocultos — en la web se muestra el mensaje de calendario 2027."
          : `${visibleCount} de ${trips.length} visible(s) en la web`}
      </p>
      {trips.map((trip) => (
        <Card
          key={trip.id}
          className={`border-white/10 rounded-2xl ${trip.active ? "bg-[#0f1f35]" : "bg-[#0f1f35]/50 border-dashed"}`}
        >
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-bold ${trip.active ? "text-white" : "text-white/50"}`}>{trip.name}</p>
                {!trip.active && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                    Oculto
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm">{trip.duration} · ${trip.price.toLocaleString("es-CL")}</p>
              <p className="text-teal text-xs mt-1">{trip.departures.length} salida(s)</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={togglingId === trip.id}
                onClick={() => void toggleVisibility(trip)}
                className={`h-9 ${
                  trip.active
                    ? "border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
                    : "border-teal/40 text-teal hover:bg-teal/10"
                }`}
                title={trip.active ? "Ocultar en la web" : "Mostrar en la web"}
              >
                {trip.active ? (
                  <><EyeOff className="h-4 w-4 mr-1.5" /> Ocultar</>
                ) : (
                  <><Eye className="h-4 w-4 mr-1.5" /> Mostrar</>
                )}
              </Button>
              <Button size="sm" onClick={() => setEditing({ ...trip, departures: mapDepartures(trip.departures) })} className="bg-white/10 text-white hover:bg-white/20 h-9">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
