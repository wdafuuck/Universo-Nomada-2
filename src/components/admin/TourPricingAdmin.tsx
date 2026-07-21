"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, RefreshCw, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDefaultPricing,
  getDisplayPricePerPerson,
  ensureOccupancyTiers,
  ensureAccommodationOccupancy,
  type TourPricingConfig,
  type PassengerTypePrices,
  type Accommodation,
  type OccupancyPricing,
} from "@/lib/tour-pricing";
import { OccupancyAdultInputs } from "@/components/admin/PackagePricingFields";

const FALLBACK_TOURS = [
  { tourId: "rapa-nui", tourName: "Rapa Nui", basePrice: 850000 },
  { tourId: "san-pedro-uyuni", tourName: "San Pedro + Uyuni", basePrice: 1658600 },
  { tourId: "cusco-machupicchu", tourName: "Cusco + Machu Picchu", basePrice: 1200000 },
  { tourId: "terapias-ancestrales", tourName: "Terapias Ancestrales", basePrice: 350000 },
  { tourId: "ballenas-elqui", tourName: "Ballenas + Elqui", basePrice: 450000 },
  { tourId: "santiago-vinedos", tourName: "Santiago + Viñedos", basePrice: 280000 },
  { tourId: "bolivia-amazonica", tourName: "Bolivia Amazónica", basePrice: 980000 },
  { tourId: "region-atacama", tourName: "Región de Atacama", basePrice: 520000 },
  { tourId: "valle-aconcagua", tourName: "Valle del Aconcagua", basePrice: 320000 },
  { tourId: "catedrales-marmol", tourName: "Catedrales de Mármol", basePrice: 1500000 },
  { tourId: "rio-janeiro", tourName: "Rio de Janeiro", basePrice: 698000 },
  { tourId: "florianopolis", tourName: "Florianópolis", basePrice: 593000 },
  { tourId: "buenos-aires", tourName: "Buenos Aires", basePrice: 450000 },
  { tourId: "mendoza", tourName: "Mendoza", basePrice: 586700 },
];

type TourOption = { tourId: string; tourName: string; basePrice: number };

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

const PRICE_FIELDS: { key: keyof PassengerTypePrices; label: string }[] = [
  { key: "adult", label: "Adulto" },
  { key: "child", label: "Niño" },
  { key: "infant", label: "Infante" },
  { key: "senior", label: "Mayor" },
];

function PriceInputs({
  prices,
  onChange,
}: {
  prices: PassengerTypePrices;
  onChange: (p: PassengerTypePrices) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {PRICE_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="text-white/40 text-xs">{label}</label>
          <Input
            type="number"
            value={prices[key]}
            onChange={(e) => onChange({ ...prices, [key]: Number(e.target.value) })}
            className="mt-1 bg-white/5 border-white/10 text-white rounded-lg h-9 text-sm"
          />
        </div>
      ))}
    </div>
  );
}

export function TourPricingAdmin() {
  const [tours, setTours] = useState<TourOption[]>(FALLBACK_TOURS);
  const [selectedId, setSelectedId] = useState(FALLBACK_TOURS[0].tourId);
  const [config, setConfig] = useState<TourPricingConfig>(() =>
    getDefaultPricing(FALLBACK_TOURS[0].tourId, FALLBACK_TOURS[0].tourName, FALLBACK_TOURS[0].basePrice)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/tours")
      .then((r) => r.json())
      .then((data) => {
        const list: TourOption[] = (data.tours ?? [])
          .filter((t: { tourId: string }) => !t.tourId.startsWith("group-"))
          .map((t: { tourId: string; name: string; price: number }) => ({
          tourId: t.tourId,
          tourName: t.name,
          basePrice: t.price,
        }));
        if (list.length > 0) {
          setTours(list);
          setSelectedId((prev) => (list.some((t) => t.tourId === prev) ? prev : list[0].tourId));
        }
      })
      .catch(() => {});
  }, []);

  const selected = tours.find((t) => t.tourId === selectedId) ?? tours[0];

  const loadTour = useCallback(async (tourId: string) => {
    const tour = tours.find((t) => t.tourId === tourId) ?? FALLBACK_TOURS.find((t) => t.tourId === tourId)!;
    try {
      const res = await fetch(`/api/tours/pricing?tourId=${encodeURIComponent(tourId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(ensureOccupancyTiers(data.config, tour.basePrice));
          return;
        }
      }
    } catch { /* defaults */ }
    setConfig(getDefaultPricing(tour.tourId, tour.tourName, tour.basePrice));
  }, [tours]);

  useEffect(() => { void loadTour(selectedId); }, [selectedId, loadTour]);

  const updatePassengerPrices = (prices: PassengerTypePrices) =>
    setConfig((c) => ({ ...c, passengerPrices: prices, basePrice: prices.adult }));

  const updateOccupancy = (idx: number, occ: OccupancyPricing) =>
    setConfig((c) => {
      const next = [...c.occupancyPricing];
      next[idx] = occ;
      return { ...c, occupancyPricing: next };
    });

  const addAccommodation = () => {
    const id = `hotel-${Date.now()}`;
    setConfig((c) => ({
      ...c,
      accommodations: [
        ...c.accommodations,
        ensureAccommodationOccupancy(
          { id, name: "Nuevo alojamiento", prices: { ...c.passengerPrices }, active: true, bookingPropertyId: null },
          c.passengerPrices,
        ),
      ],
    }));
  };

  const updateAccommodation = (idx: number, acc: Accommodation) => {
    setConfig((c) => {
      const next = [...c.accommodations];
      next[idx] = ensureAccommodationOccupancy(acc, c.passengerPrices);
      return { ...c, accommodations: next };
    });
  };

  const removeAccommodation = (idx: number) =>
    setConfig((c) => ({ ...c, accommodations: c.accommodations.filter((_, i) => i !== idx) }));

  const resetDefaults = () => setConfig(getDefaultPricing(selected.tourId, selected.tourName, selected.basePrice));

  const save = async () => {
    setSaving(true);
    const normalized = ensureOccupancyTiers(config, selected.basePrice);
    const displayPrice = getDisplayPricePerPerson(normalized);
    try {
      const res = await fetch("/api/admin/tour-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: selectedId,
          tourName: selected.tourName,
          basePrice: displayPrice,
          config: {
            passengerPrices: normalized.passengerPrices,
            occupancyPricing: normalized.occupancyPricing,
            accommodations: normalized.accommodations,
            tiers: normalized.tiers,
          },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuración guardada — cierra el panel para ver los cambios en la web");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const displayFromWeb = getDisplayPricePerPerson(config);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tours.map((t) => (
          <button key={t.tourId} onClick={() => setSelectedId(t.tourId)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedId === t.tourId ? "bg-teal text-navy" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
            {t.tourName}
          </button>
        ))}
      </div>

      <Card className="bg-navy-light border-white/5 rounded-2xl">
        <CardContent className="p-6 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-white font-bold text-lg">{selected.tourName}</h3>
            <div className="flex gap-2">
              <Button onClick={resetDefaults} variant="outline" size="sm" className="bg-white/5 border-white/10 text-white">
                <RefreshCw className="h-4 w-4 mr-1" /> Restaurar
              </Button>
              <Button onClick={save} disabled={saving} size="sm" className="bg-teal text-navy font-bold">
                <Save className="h-4 w-4 mr-1" /> {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-2">Precios por tipo de pasajero (default)</h4>
            <p className="text-white/40 text-xs mb-3">Estos valores aplican cuando no hay override por cantidad de personas o alojamiento.</p>
            <PriceInputs prices={config.passengerPrices} onChange={updatePassengerPrices} />
            <p className="text-white/30 text-xs mt-2">Referencia fallback — el &quot;Desde&quot; en la web usa el precio de 2 personas abajo.</p>
          </div>

          <div>
            <div className="mb-3">
              <h4 className="text-white font-semibold">Precio por persona según cantidad de viajeros</h4>
              <p className="text-white/40 text-xs mt-1">
                Configura el precio por adulto para 1, 2 y 3 personas. Del 4° pasajero en adelante se aplica el precio de 2 personas.
              </p>
              <p className="text-teal text-sm font-semibold mt-2">
                Desde en la web (2 personas): {formatCLP(displayFromWeb)} / persona
              </p>
            </div>
            <div className="space-y-4">
              {config.occupancyPricing.map((occ, idx) => (
                <div key={occ.passengerCount} className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-white font-semibold text-sm mb-3">
                    {occ.passengerCount} {occ.passengerCount === 1 ? "persona" : "personas"}
                  </p>
                  <PriceInputs prices={occ.prices} onChange={(p) => updateOccupancy(idx, { ...occ, prices: p })} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal" /> Alojamientos
                </h4>
                <p className="text-white/40 text-xs">Precio por persona según 1, 2 o 3 viajeros. ID Booking.com para disponibilidad.</p>
              </div>
              <Button onClick={addAccommodation} size="sm" variant="outline" className="bg-white/5 border-white/10 text-white">
                <Plus className="h-4 w-4 mr-1" /> Agregar hotel
              </Button>
            </div>
            <div className="space-y-4">
              {config.accommodations.map((acc, idx) => (
                <div key={acc.id} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs">Nombre</label>
                      <Input value={acc.name}
                        onChange={(e) => updateAccommodation(idx, { ...acc, name: e.target.value })}
                        className="mt-1 bg-white/5 border-white/10 text-white rounded-lg h-9" />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs">Estrellas</label>
                      <select
                        value={acc.stars === 2 || acc.stars === 3 || acc.stars === 4 || acc.stars === 5 ? acc.stars : ""}
                        onChange={(e) =>
                          updateAccommodation(idx, {
                            ...acc,
                            stars: e.target.value
                              ? (Number(e.target.value) as 2 | 3 | 4 | 5)
                              : null,
                          })
                        }
                        className="mt-1 w-full h-9 rounded-md bg-white/5 border border-white/10 text-white text-sm px-2"
                      >
                        <option value="" className="bg-navy">Sin estrellas</option>
                        <option value="2" className="bg-navy">2 estrellas</option>
                        <option value="3" className="bg-navy">3 estrellas</option>
                        <option value="4" className="bg-navy">4 estrellas</option>
                        <option value="5" className="bg-navy">5 estrellas</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs">ID propiedad Booking.com</label>
                      <Input type="number" value={acc.bookingPropertyId ?? ""}
                        placeholder="Ej: 10507360"
                        onChange={(e) => updateAccommodation(idx, { ...acc, bookingPropertyId: e.target.value ? Number(e.target.value) : null })}
                        className="mt-1 bg-white/5 border-white/10 text-white rounded-lg h-9" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-white/40 text-xs">URL Booking (opcional)</label>
                      <Input value={acc.bookingUrl ?? ""}
                        placeholder="https://www.booking.com/hotel/..."
                        onChange={(e) => updateAccommodation(idx, { ...acc, bookingUrl: e.target.value })}
                        className="mt-1 bg-white/5 border-white/10 text-white rounded-lg h-9" />
                    </div>
                  </div>
                  <OccupancyAdultInputs
                    occupancyPricing={acc.occupancyPricing ?? []}
                    onChange={(occupancyPricing) => {
                      const occ2 = occupancyPricing.find((o) => o.passengerCount === 2);
                      updateAccommodation(idx, {
                        ...acc,
                        occupancyPricing,
                        prices: occ2?.prices ?? acc.prices,
                      });
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer">
                      <input type="checkbox" checked={acc.active}
                        onChange={(e) => updateAccommodation(idx, { ...acc, active: e.target.checked })}
                        className="rounded" />
                      Activo
                    </label>
                    <button onClick={() => removeAccommodation(idx)} className="text-red-400 text-xs hover:underline">Eliminar</button>
                  </div>
                </div>
              ))}
              {config.accommodations.length === 0 && (
                <p className="text-white/30 text-sm text-center py-4">Sin alojamientos configurados para este tour.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
