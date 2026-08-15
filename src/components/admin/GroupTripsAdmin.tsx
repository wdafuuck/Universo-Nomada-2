"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  Save,
  Plus,
  Trash2,
  Coffee,
  UtensilsCrossed,
  Moon,
  Wine,
  Upload,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEPARTURE_AVAILABILITY_OPTIONS,
  type DepartureAvailability,
  normalizeDepartureAvailability,
} from "@/lib/group-departure-availability";
import {
  emptyAccommodation,
  emptyItineraryDay,
  parseAccommodationsJson,
  parseItineraryJson,
  type GroupAccommodationInfo,
  type GroupDayMeals,
  type GroupItineraryDay,
} from "@/lib/group-trip-content";

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
  itineraryJson?: string;
  accommodationsJson?: string;
  active: boolean;
  departures: Departure[];
};

type EditState = Trip & {
  includesText: string;
  itinerary: GroupItineraryDay[];
  accommodations: GroupAccommodationInfo[];
  isNew?: boolean;
};

const MEAL_META: {
  key: keyof GroupDayMeals;
  label: string;
  Icon: typeof Coffee;
}[] = [
  { key: "breakfast", label: "Desayuno", Icon: Coffee },
  { key: "lunch", label: "Almuerzo", Icon: UtensilsCrossed },
  { key: "dinner", label: "Cena", Icon: Moon },
  { key: "cocktail", label: "Cóctel", Icon: Wine },
];

function mapDepartures(raw: Departure[]): Departure[] {
  return raw.map((d) => ({
    ...d,
    availabilityStatus: normalizeDepartureAvailability(d.availabilityStatus, d.spotsLeft),
  }));
}

function toEditState(trip: Trip, isNew = false): EditState {
  let includes: string[] = [];
  try {
    includes = JSON.parse(trip.includesJson || "[]");
  } catch {
    includes = [];
  }
  return {
    ...trip,
    departures: mapDepartures(trip.departures ?? []),
    includesText: includes.join("\n"),
    itinerary: parseItineraryJson(trip.itineraryJson),
    accommodations: parseAccommodationsJson(trip.accommodationsJson),
    isNew,
  };
}

function blankTrip(): EditState {
  return toEditState(
    {
      id: 0,
      tourId: "",
      name: "",
      duration: "5D/4N",
      image: "",
      gradient: "from-teal-500 to-cyan-600",
      reservation: 100000,
      price: 0,
      includesJson: "[]",
      itineraryJson: "[]",
      accommodationsJson: "[]",
      active: true,
      departures: [{ date: "", availabilityStatus: "available" }],
    },
    true,
  );
}

export function GroupTripsAdmin() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    fetch("/api/admin/group-trips", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        const list = (d.trips ?? []).map((t: Trip) => ({
          ...t,
          departures: mapDepartures(t.departures ?? []),
        }));
        setTrips(list);
      })
      .catch(() => toast.error("No se pudieron cargar los viajes grupales. Recarga la página."));
  };

  useEffect(() => {
    load();
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return (data.url as string) || null;
    } catch {
      toast.error("No se pudo subir la imagen");
      return null;
    } finally {
      setUploading(false);
    }
  };

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

  const removeTrip = async (trip: Trip) => {
    if (!confirm(`¿Eliminar el viaje grupal "${trip.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/group-trips/${trip.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      toast.success("Viaje eliminado");
      load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const includes = editing.includesText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const body = {
        name: editing.name.trim(),
        duration: editing.duration.trim(),
        image: editing.image.trim(),
        gradient: editing.gradient,
        reservation: editing.reservation,
        price: editing.price,
        active: editing.active,
        includes,
        itinerary: editing.itinerary.map((d, i) => ({
          ...d,
          day: i + 1,
          activities: d.activities.filter((a) => a.trim()),
        })),
        accommodations: editing.accommodations.filter((a) => a.name.trim()),
        departures: editing.departures
          .filter((d) => d.date.trim())
          .map(({ date, availabilityStatus }) => ({ date, availabilityStatus })),
      };

      const res = editing.isNew
        ? await fetch("/api/admin/group-trips", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/admin/group-trips/${editing.id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error");
      }
      toast.success(editing.isNew ? "Viaje grupal creado" : "Viaje grupal actualizado");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
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

  const updateDay = (i: number, patch: Partial<GroupItineraryDay>) => {
    if (!editing) return;
    const days = [...editing.itinerary];
    days[i] = { ...days[i], ...patch };
    setEditing({ ...editing, itinerary: days });
  };

  const toggleMeal = (dayIdx: number, key: keyof GroupDayMeals) => {
    if (!editing) return;
    const days = [...editing.itinerary];
    const meals = { ...days[dayIdx].meals, [key]: !days[dayIdx].meals[key] };
    days[dayIdx] = { ...days[dayIdx], meals };
    setEditing({ ...editing, itinerary: days });
  };

  const moveDay = (i: number, dir: -1 | 1) => {
    if (!editing) return;
    const j = i + dir;
    if (j < 0 || j >= editing.itinerary.length) return;
    const days = [...editing.itinerary];
    [days[i], days[j]] = [days[j], days[i]];
    setEditing({
      ...editing,
      itinerary: days.map((d, idx) => ({ ...d, day: idx + 1 })),
    });
  };

  const updateAcc = (i: number, patch: Partial<GroupAccommodationInfo>) => {
    if (!editing) return;
    const list = [...editing.accommodations];
    list[i] = { ...list[i], ...patch };
    setEditing({ ...editing, accommodations: list });
  };

  const visibleCount = trips.filter((t) => t.active).length;

  if (editing) {
    return (
      <Card className="bg-[#0f1f35] border-white/10 rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <h3 className="text-white font-bold text-lg">
            {editing.isNew ? "Nuevo viaje grupal" : `Editar: ${editing.name}`}
          </h3>

          {/* Datos básicos */}
          <section className="space-y-3">
            <p className="text-teal text-xs font-bold uppercase tracking-wider">Datos generales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Nombre del viaje"
              />
              <Input
                value={editing.duration}
                onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Duración (ej. 5D/4N)"
              />
              <div>
                <label className="text-white/40 text-xs mb-1 block">Precio por persona (CLP)</label>
                <Input
                  type="number"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">
                  Reserva mínima / abono por persona (CLP)
                </label>
                <Input
                  type="number"
                  value={editing.reservation}
                  onChange={(e) => setEditing({ ...editing, reservation: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-white/30 text-[10px] mt-1">
                  Igual que en paquetes: el cliente puede reservar pagando este mínimo.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={editing.image}
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                className="bg-white/5 border-white/10 text-white flex-1 min-w-[200px]"
                placeholder="URL imagen portada"
              />
              <label className="inline-flex items-center gap-2 cursor-pointer text-teal text-sm font-medium px-3 py-2 rounded-lg bg-teal/10">
                <Upload className="h-4 w-4" />
                {uploading ? "Subiendo…" : "Subir portada"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await uploadImage(f);
                    if (url) setEditing({ ...editing, image: url });
                  }}
                />
              </label>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Incluye (uno por línea)</label>
              <Textarea
                value={editing.includesText}
                onChange={(e) => setEditing({ ...editing, includesText: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                placeholder={"Vuelo\nHotel + desayuno\nTours\nLíder de grupo"}
              />
            </div>
          </section>

          {/* Salidas */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-teal text-xs font-bold uppercase tracking-wider">Salidas y cupos</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setEditing({
                    ...editing,
                    departures: [
                      ...editing.departures,
                      { date: "", availabilityStatus: "available" },
                    ],
                  })
                }
                className="border-white/20 text-white bg-white/5 h-8"
              >
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
                  onClick={() =>
                    setEditing({
                      ...editing,
                      departures: editing.departures.filter((_, idx) => idx !== i),
                    })
                  }
                  className="text-red-400 p-2 justify-self-end"
                  aria-label="Eliminar salida"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>

          {/* Itinerario */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-teal text-xs font-bold uppercase tracking-wider">
                Itinerario por día
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setEditing({
                    ...editing,
                    itinerary: [
                      ...editing.itinerary,
                      emptyItineraryDay(editing.itinerary.length + 1),
                    ],
                  })
                }
                className="border-white/20 text-white bg-white/5 h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Día
              </Button>
            </div>
            {editing.itinerary.length === 0 && (
              <p className="text-white/35 text-sm">Aún no hay días. Agrega el Día 1.</p>
            )}
            {editing.itinerary.map((day, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-bold text-sm">Día {i + 1}</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveDay(i, -1)}
                      className="text-white/50 p-1.5 hover:text-white"
                      aria-label="Subir día"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDay(i, 1)}
                      className="text-white/50 p-1.5 hover:text-white"
                      aria-label="Bajar día"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          itinerary: editing.itinerary
                            .filter((_, idx) => idx !== i)
                            .map((d, idx) => ({ ...d, day: idx + 1 })),
                        })
                      }
                      className="text-red-400 p-1.5"
                      aria-label="Eliminar día"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Input
                  value={day.title}
                  onChange={(e) => updateDay(i, { title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Título del día"
                />
                <Textarea
                  value={day.description}
                  onChange={(e) => updateDay(i, { description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white min-h-[72px]"
                  placeholder="Breve descripción del día"
                />
                <Textarea
                  value={day.activities.join("\n")}
                  onChange={(e) =>
                    updateDay(i, {
                      activities: e.target.value.split("\n"),
                    })
                  }
                  className="bg-white/5 border-white/10 text-white min-h-[72px]"
                  placeholder={"Actividades del día (una por línea)\nEj: Tour Valle de la Luna\nVisita a geyser"}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={day.image}
                    onChange={(e) => updateDay(i, { image: e.target.value })}
                    className="bg-white/5 border-white/10 text-white flex-1 min-w-[160px]"
                    placeholder="Foto del día"
                  />
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-teal text-xs font-medium px-2.5 py-2 rounded-lg bg-teal/10">
                    <Upload className="h-3.5 w-3.5" />
                    Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await uploadImage(f);
                        if (url) updateDay(i, { image: url });
                      }}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-white/40 text-xs self-center mr-1">Comidas:</span>
                  {MEAL_META.map(({ key, label, Icon }) => {
                    const on = day.meals[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleMeal(i, key)}
                        title={label}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                          on
                            ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                            : "bg-white/5 border-white/15 text-white/40"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* Alojamientos */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-teal text-xs font-bold uppercase tracking-wider">
                Alojamientos
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setEditing({
                    ...editing,
                    accommodations: [...editing.accommodations, emptyAccommodation()],
                  })
                }
                className="border-white/20 text-white bg-white/5 h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Hotel
              </Button>
            </div>
            {editing.accommodations.length === 0 && (
              <p className="text-white/35 text-sm">Sin alojamientos cargados.</p>
            )}
            {editing.accommodations.map((acc, i) => (
              <div
                key={acc.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2"
              >
                <div className="flex justify-between gap-2">
                  <Input
                    value={acc.name}
                    onChange={(e) => updateAcc(i, { name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Nombre del hotel"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        accommodations: editing.accommodations.filter((_, idx) => idx !== i),
                      })
                    }
                    className="text-red-400 p-2 shrink-0"
                    aria-label="Eliminar alojamiento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Textarea
                  value={acc.description}
                  onChange={(e) => updateAcc(i, { description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white min-h-[64px]"
                  placeholder="Breve descripción"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={acc.image}
                    onChange={(e) => updateAcc(i, { image: e.target.value })}
                    className="bg-white/5 border-white/10 text-white flex-1 min-w-[160px]"
                    placeholder="Foto del hotel"
                  />
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-teal text-xs font-medium px-2.5 py-2 rounded-lg bg-teal/10">
                    <Upload className="h-3.5 w-3.5" />
                    Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await uploadImage(f);
                        if (url) updateAcc(i, { image: url });
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </section>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => void save()} disabled={saving} className="bg-teal text-[#070f1a] font-bold">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              className="border-white/20 text-white"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-white/50 text-sm">
          {visibleCount === 0
            ? "Todos los viajes están ocultos — en la web se muestra el mensaje de calendario 2027."
            : `${visibleCount} de ${trips.length} visible(s) en la web`}
        </p>
        <Button
          onClick={() => setEditing(blankTrip())}
          className="bg-teal text-[#070f1a] font-bold h-9"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Agregar grupal
        </Button>
      </div>
      {trips.map((trip) => (
        <Card
          key={trip.id}
          className={`border-white/10 rounded-2xl ${trip.active ? "bg-[#0f1f35]" : "bg-[#0f1f35]/50 border-dashed"}`}
        >
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-bold ${trip.active ? "text-white" : "text-white/50"}`}>
                  {trip.name}
                </p>
                {!trip.active && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                    Oculto
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm">
                {trip.duration} · ${trip.price.toLocaleString("es-CL")} · Reserva $
                {trip.reservation.toLocaleString("es-CL")}
              </p>
              <p className="text-teal text-xs mt-1">
                {trip.departures.length} salida(s)
                {parseItineraryJson(trip.itineraryJson).length > 0
                  ? ` · ${parseItineraryJson(trip.itineraryJson).length} días`
                  : ""}
              </p>
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
                  <>
                    <EyeOff className="h-4 w-4 mr-1.5" /> Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" /> Mostrar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setEditing(toEditState(trip))}
                className="bg-white/10 text-white hover:bg-white/20 h-9"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void removeTrip(trip)}
                className="border-red-400/30 text-red-300 hover:bg-red-400/10 h-9"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
