"use client";

import { Plus, Building2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadAwareImage } from "@/components/UploadAwareImage";
import {
  ensureAccommodationOccupancy,
  ensureOccupancyTiers,
  getCheapestAccommodation2Pax,
  getAccommodationAdult2Pax,
  getDisplayPricePerPerson,
  pricesFromAdultPerPerson,
  syncPricingFromAccommodations,
  usesAccommodationPricing,
  type Accommodation,
  type AvailabilityProvider,
  type OccupancyPricing,
  type TourPricingConfig,
} from "@/lib/tour-pricing";
import { AdminReorderControls, moveArrayItem } from "@/components/admin/AdminReorderControls";
import { HotelStars, normalizeHotelStars, type HotelStarRating } from "@/components/HotelStars";

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

const PROVIDER_LABELS: Record<AvailabilityProvider, string> = {
  manual: "Sin verificación automática",
  liteapi: "LiteAPI (disponibilidad + precio)",
  booking: "Booking.com (solo disponibilidad)",
  ratehawk: "RateHawk (disponibilidad + precio)",
};

function inferProvider(acc: Accommodation): AvailabilityProvider {
  if (acc.availabilityProvider) return acc.availabilityProvider;
  if (acc.liteapiHotelId) return "liteapi";
  if (acc.ratehawkHotelId) return "ratehawk";
  if (acc.bookingPropertyId) return "booking";
  return "manual";
}

type Props = {
  config: TourPricingConfig;
  onChange: (config: TourPricingConfig) => void;
};

export function OccupancyAdultInputs({
  occupancyPricing,
  onChange,
}: {
  occupancyPricing: OccupancyPricing[];
  onChange: (next: OccupancyPricing[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[1, 2, 3].map((n) => {
        const idx = occupancyPricing.findIndex((o) => o.passengerCount === n);
        const occ = occupancyPricing[idx] ?? { passengerCount: n, prices: pricesFromAdultPerPerson(0) };
        return (
          <div key={n}>
            <label className="text-white/40 text-xs">
              {n} {n === 1 ? "persona" : "personas"} / persona
            </label>
            <Input
              type="number"
              value={occ.prices.adult || ""}
              onChange={(e) => {
                const adult = Number(e.target.value) || 0;
                const next = [...occupancyPricing];
                const entry = { passengerCount: n, prices: pricesFromAdultPerPerson(adult) };
                if (idx >= 0) next[idx] = entry;
                else next.push(entry);
                next.sort((a, b) => a.passengerCount - b.passengerCount);
                onChange(next);
              }}
              className="mt-1 bg-white/5 border-white/10 text-white h-9"
            />
          </div>
        );
      })}
    </div>
  );
}

export function PackagePricingFields({ config, onChange }: Props) {
  const displayFromWeb = getDisplayPricePerPerson(config);
  const cheapest = getCheapestAccommodation2Pax(config);

  const emit = (next: TourPricingConfig) => {
    const withTiers = ensureOccupancyTiers(next, next.basePrice);
    onChange(usesAccommodationPricing(withTiers) ? syncPricingFromAccommodations(withTiers) : withTiers);
  };

  const patch = (partial: Partial<TourPricingConfig>) => {
    emit({ ...config, ...partial });
  };

  const addAccommodation = () => {
    const id = `hotel-${Date.now()}`;
    const refAdult = cheapest ? getAccommodationAdult2Pax(cheapest) : 0;
    const acc: Accommodation = ensureAccommodationOccupancy(
      { id, name: "Nuevo alojamiento", prices: pricesFromAdultPerPerson(refAdult), active: true, bookingPropertyId: null },
      config.passengerPrices,
    );
    emit({ ...config, accommodations: [...config.accommodations, acc] });
  };

  const updateAccommodation = (idx: number, acc: Accommodation) => {
    const next = [...config.accommodations];
    next[idx] = ensureAccommodationOccupancy(acc, config.passengerPrices);
    const occ2 = next[idx].occupancyPricing?.find((o) => o.passengerCount === 2);
    if (occ2) next[idx].prices = occ2.prices;
    emit({ ...config, accommodations: next });
  };

  const removeAccommodation = (idx: number) => {
    emit({ ...config, accommodations: config.accommodations.filter((_, i) => i !== idx) });
  };

  const moveAccommodation = (from: number, to: number) => {
    emit({ ...config, accommodations: moveArrayItem(config.accommodations, from, to) });
  };

  const uploadAccImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al subir");
    return data.url as string;
  };

  const setAccOccupancy = (idx: number, occupancyPricing: OccupancyPricing[]) => {
    const acc = config.accommodations[idx];
    const occ2 = occupancyPricing.find((o) => o.passengerCount === 2);
    updateAccommodation(idx, {
      ...acc,
      occupancyPricing,
      prices: occ2?.prices ?? acc.prices,
    });
  };

  return (
    <div className="p-4 bg-white/5 rounded-xl space-y-6 border border-white/5">
      <div>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div>
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal" /> Precios por alojamiento
            </h4>
            <p className="text-white/40 text-xs mt-1">
              Define el precio por persona para cada hotel (1, 2 y 3 viajeros). En la web principal se muestra el más económico para 2 personas.
              Usa las flechas para cambiar el orden en la ficha del paquete.
            </p>
          </div>
          <Button
            type="button"
            onClick={addAccommodation}
            size="sm"
            variant="outline"
            className="bg-white/5 border-white/10 text-white shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar alojamiento
          </Button>
        </div>

        <div className="space-y-4">
          {config.accommodations.map((acc, idx) => {
            const occ = acc.occupancyPricing ?? [];
            const isCheapest = cheapest?.id === acc.id;
            return (
              <div
                key={acc.id}
                className={`p-4 rounded-xl border space-y-3 ${
                  isCheapest ? "bg-teal/10 border-teal/30" : "bg-navy/40 border-white/10"
                }`}
              >
                {isCheapest && (
                  <p className="text-teal text-xs font-semibold">Más económico — este precio aparece en la página principal</p>
                )}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white/30 text-xs">Orden {idx + 1}</p>
                  <AdminReorderControls
                    index={idx}
                    total={config.accommodations.length}
                    onMove={moveAccommodation}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/40 text-xs">Nombre del alojamiento</label>
                    <Input
                      value={acc.name}
                      onChange={(e) => updateAccommodation(idx, { ...acc, name: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10 text-white h-9"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs">Estrellas</label>
                    <div className="mt-1 flex items-center gap-2">
                      <select
                        value={normalizeHotelStars(acc.stars) ?? ""}
                        onChange={(e) => {
                          const stars = e.target.value
                            ? (Number(e.target.value) as HotelStarRating)
                            : null;
                          updateAccommodation(idx, { ...acc, stars });
                        }}
                        className="w-full h-9 rounded-md bg-white/5 border border-white/10 text-white text-sm px-2"
                      >
                        <option value="" className="bg-navy">Sin estrellas</option>
                        <option value="2" className="bg-navy">2 estrellas</option>
                        <option value="3" className="bg-navy">3 estrellas</option>
                        <option value="4" className="bg-navy">4 estrellas</option>
                        <option value="5" className="bg-navy">5 estrellas</option>
                      </select>
                      <HotelStars stars={acc.stars} size="md" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-white/40 text-xs">Verificación de disponibilidad</label>
                    <select
                      value={inferProvider(acc)}
                      onChange={(e) => {
                        const provider = e.target.value as AvailabilityProvider;
                        updateAccommodation(idx, {
                          ...acc,
                          availabilityProvider: provider,
                          liteapiHotelId: provider === "liteapi" ? acc.liteapiHotelId : null,
                          liteapiMaxPriceUsd: provider === "liteapi" ? acc.liteapiMaxPriceUsd : null,
                          bookingPropertyId: provider === "booking" ? acc.bookingPropertyId : null,
                          ratehawkHotelId: provider === "ratehawk" ? acc.ratehawkHotelId : null,
                          ratehawkMaxPriceUsd: provider === "ratehawk" ? acc.ratehawkMaxPriceUsd : null,
                        });
                      }}
                      className="mt-1 w-full h-9 rounded-md bg-white/5 border border-white/10 text-white text-sm px-2"
                    >
                      {(Object.keys(PROVIDER_LABELS) as AvailabilityProvider[]).map((key) => (
                        <option key={key} value={key} className="bg-navy">
                          {PROVIDER_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {inferProvider(acc) === "liteapi" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs">ID LiteAPI (Nuitée)</label>
                      <Input
                        value={acc.liteapiHotelId ?? ""}
                        placeholder="Ej: lp3803c"
                        onChange={(e) =>
                          updateAccommodation(idx, {
                            ...acc,
                            liteapiHotelId: e.target.value.trim() || null,
                          })
                        }
                        className="mt-1 bg-white/5 border-white/10 text-white h-9"
                      />
                      <p className="text-white/30 text-[10px] mt-1">
                        Busca el hotel en LiteAPI → Documentación → data/hotels, o con{" "}
                        <code className="text-teal/80">node --env-file=.env scripts/test-liteapi.mjs --search &quot;Santiago&quot; CL</code>
                      </p>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs">Tope USD (hab. doble, 2 pax)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={acc.liteapiMaxPriceUsd ?? ""}
                        placeholder="Ej: 150"
                        onChange={(e) =>
                          updateAccommodation(idx, {
                            ...acc,
                            liteapiMaxPriceUsd: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="mt-1 bg-white/5 border-white/10 text-white h-9"
                      />
                    </div>
                  </div>
                )}

                {inferProvider(acc) === "booking" && (
                  <div>
                    <label className="text-white/40 text-xs">ID Booking.com</label>
                    <Input
                      type="number"
                      value={acc.bookingPropertyId ?? ""}
                      placeholder="Ej: 10507360"
                      onChange={(e) =>
                        updateAccommodation(idx, {
                          ...acc,
                          bookingPropertyId: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="mt-1 bg-white/5 border-white/10 text-white h-9"
                    />
                  </div>
                )}

                {inferProvider(acc) === "ratehawk" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs">ID RateHawk (hid)</label>
                      <Input
                        type="number"
                        value={acc.ratehawkHotelId ?? ""}
                        placeholder="Ej: 10004873"
                        onChange={(e) =>
                          updateAccommodation(idx, {
                            ...acc,
                            ratehawkHotelId: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="mt-1 bg-white/5 border-white/10 text-white h-9"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs">Tope USD (hab. doble, 2 pax)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={acc.ratehawkMaxPriceUsd ?? ""}
                        placeholder="Ej: 150"
                        onChange={(e) =>
                          updateAccommodation(idx, {
                            ...acc,
                            ratehawkMaxPriceUsd: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="mt-1 bg-white/5 border-white/10 text-white h-9"
                      />
                    </div>
                    <p className="sm:col-span-2 text-white/30 text-[10px]">
                      Si el precio real supera el tope, el cliente verá disponible con recargo:
                      (precio real − tope) × tipo de cambio ÷ 2 por persona.
                    </p>
                  </div>
                )}

                <OccupancyAdultInputs
                  occupancyPricing={occ}
                  onChange={(next) => setAccOccupancy(idx, next)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/40 text-xs">Foto del alojamiento</label>
                    <div className="mt-1 flex gap-2 items-center">
                      <Input
                        value={acc.image ?? ""}
                        placeholder="/uploads/hotel.jpg"
                        onChange={(e) => updateAccommodation(idx, { ...acc, image: e.target.value })}
                        className="bg-white/5 border-white/10 text-white h-9 flex-1"
                      />
                      <label className="inline-flex items-center gap-1 cursor-pointer text-teal text-xs px-2 py-2 rounded-lg bg-teal/10 shrink-0">
                        <Upload className="h-3.5 w-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            void uploadAccImage(f)
                              .then((url) => updateAccommodation(idx, { ...acc, image: url }))
                              .catch((err) => toast.error(err instanceof Error ? err.message : "Error"));
                          }}
                        />
                      </label>
                    </div>
                    {acc.image && (
                      <div className="relative h-20 w-28 mt-2 rounded-lg overflow-hidden border border-white/10">
                        <UploadAwareImage src={acc.image} alt="" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex flex-wrap items-center gap-5">
                    <label className="flex items-center gap-2 text-white/60 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acc.active}
                        onChange={(e) => updateAccommodation(idx, { ...acc, active: e.target.checked })}
                        className="rounded"
                      />
                      Visible en la web
                    </label>
                    <label className="flex items-center gap-2 text-white text-sm cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <input
                        type="checkbox"
                        checked={acc.includesBreakfast !== false}
                        onChange={(e) =>
                          updateAccommodation(idx, { ...acc, includesBreakfast: e.target.checked })
                        }
                        className="rounded"
                      />
                      Incluye desayuno
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAccommodation(idx)}
                    className="text-red-400 text-xs hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
                <p className="text-white/30 text-[10px]">
                  Desmarca &quot;Incluye desayuno&quot; si el hotel no lo ofrece — en el carrito se verá &quot;Sin desayuno&quot;.
                </p>
              </div>
            );
          })}
          {config.accommodations.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">
              Agrega al menos un alojamiento con precios por 1, 2 y 3 personas.
            </p>
          )}
        </div>
      </div>

      <p className="text-teal text-sm font-semibold border-t border-white/10 pt-4">
        {cheapest ? (
          <>
            &quot;Desde&quot; en la web (2 personas): {formatCLP(displayFromWeb)} / persona
            <span className="text-white/50 font-normal text-xs block mt-1">
              Según {cheapest.name} — alojamiento más económico
            </span>
          </>
        ) : (
          <span className="text-white/50 font-normal text-sm">
            Agrega al menos un alojamiento activo con precio para 2 personas para definir el &quot;Desde&quot; en la web.
          </span>
        )}
      </p>
    </div>
  );
}
