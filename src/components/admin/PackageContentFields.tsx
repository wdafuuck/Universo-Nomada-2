"use client";

import Image from "next/image";
import { Plus, Trash2, Upload, FileText, Plane } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  defaultFaqJson,
  parseFaq,
  PACKAGE_GALLERY_MAX,
  parseGallery,
  parseOptionalTours,
  type BundledIncludedTour,
  type OptionalTourOption,
  type PackageGalleryImage,
  type TourAddon,
} from "@/lib/tour-content";
import { AdminReorderControls, moveArrayItem } from "@/components/admin/AdminReorderControls";

export type PackageContentState = {
  includesText: string;
  excludesText: string;
  highlightsText: string;
  pdfUrl: string;
  galleryJson: string;
  faqJson: string;
  optionalToursJson: string;
  flightOrigin: string;
  flightDestination: string;
  flightBudgetMax: number | null;
};

type Props = {
  value: PackageContentState;
  onChange: (next: PackageContentState) => void;
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error al subir");
  return data.url as string;
}

export function PackageContentFields({ value, onChange }: Props) {
  const gallery = parseGallery(value.galleryJson);
  const faq = parseFaq(value.faqJson);
  const optional = parseOptionalTours(value.optionalToursJson);

  const patch = (partial: Partial<PackageContentState>) => onChange({ ...value, ...partial });

  const setGallery = (items: PackageGalleryImage[]) =>
    patch({ galleryJson: JSON.stringify(items.slice(0, PACKAGE_GALLERY_MAX)) });
  const setFaq = (items: { q: string; a: string }[]) => patch({ faqJson: JSON.stringify(items.slice(0, 5)) });
  const setOptional = (pickCount: number, options: OptionalTourOption[], additionalActivities?: OptionalTourOption[]) =>
    patch({ optionalToursJson: JSON.stringify({ pickCount, options, additionalActivities: additionalActivities ?? optional.additionalActivities ?? [], hasBundledIncluded: optional.hasBundledIncluded, bundledIncludedTours: optional.bundledIncludedTours ?? [] }) });

  const setBundledIncluded = (hasBundledIncluded: boolean, bundledIncludedTours: BundledIncludedTour[]) =>
    patch({
      optionalToursJson: JSON.stringify({
        ...optional,
        hasBundledIncluded,
        bundledIncludedTours,
      }),
    });

  const moveBundledIncludedTour = (from: number, to: number) => {
    setBundledIncluded(optional.hasBundledIncluded ?? false, moveArrayItem(optional.bundledIncludedTours ?? [], from, to));
  };

  const setAdditionalActivities = (additionalActivities: OptionalTourOption[]) =>
    setOptional(optional.pickCount, optional.options, additionalActivities);

  const moveOptionalTour = (from: number, to: number) => {
    setOptional(optional.pickCount, moveArrayItem(optional.options, from, to), optional.additionalActivities);
  };

  const moveAdditionalActivity = (from: number, to: number) => {
    setAdditionalActivities(moveArrayItem(optional.additionalActivities ?? [], from, to));
  };

  const handleUpload = async (file: File, onUrl: (url: string) => void) => {
    const isImage = file.type.startsWith("image/");
    if (isImage && file.size > 25 * 1024 * 1024) {
      toast.error("La imagen supera 25 MB. Comprímela un poco e intenta de nuevo.");
      return;
    }
    try {
      const url = await uploadFile(file);
      onUrl(url);
      toast.success("Archivo subido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    }
  };

  const faqItems = faq.length >= 5 ? faq : [
    ...faq,
    ...Array.from({ length: 5 - faq.length }, () => ({ q: "", a: "" })),
  ];

  const removeGalleryPhoto = (index: number) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const addGalleryPhoto = (url: string) => {
    if (gallery.length >= PACKAGE_GALLERY_MAX) return;
    setGallery([...gallery, { url, objectPosition: "50% 50%" }]);
  };

  const updateGalleryPosition = (index: number, axis: "x" | "y", value: number) => {
    const next = [...gallery];
    const current = next[index];
    const [x = "50%", y = "50%"] = current.objectPosition.split(" ");
    next[index] = {
      ...current,
      objectPosition: axis === "x" ? `${value}% ${y}` : `${x} ${value}%`,
    };
    setGallery(next);
  };

  const getGalleryPositionValue = (position: string, axis: "x" | "y") => {
    const [x = "50%", y = "50%"] = position.split(" ");
    const raw = axis === "x" ? x : y;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : 50;
  };

  return (
    <div className="space-y-6 pt-4 border-t border-white/10">
      <div>
        <label className="text-white/40 text-xs">Destacados (uno por línea — sección &quot;Destacados&quot; en la web)</label>
        <Textarea
          value={value.highlightsText}
          onChange={(e) => patch({ highlightsText: e.target.value })}
          placeholder={"Visita a los moais en Ahu Tongariki\nPlaya de Anakena y sus palmeras\nVolcán Rano Raraku"}
          className="mt-1 bg-white/5 border-white/10 text-white min-h-[90px]"
        />
      </div>

      <div>
        <label className="text-white/40 text-xs">Incluye (uno por línea — sección &quot;¿Qué incluye?&quot; en la web)</label>
        <Textarea
          value={value.includesText}
          onChange={(e) => patch({ includesText: e.target.value })}
          placeholder={"Vuelo SCL - CJC - SCL\n3 Noches de Hotel\nTraslados aeropuerto - hotel"}
          className="mt-1 bg-white/5 border-white/10 text-white min-h-[90px]"
        />
      </div>

      <div>
        <label className="text-white/40 text-xs">No incluye (uno por línea — sección &quot;¿Qué no incluye?&quot; en la web)</label>
        <Textarea
          value={value.excludesText}
          onChange={(e) => patch({ excludesText: e.target.value })}
          placeholder={"Propinas y gastos personales\nAlmuerzos y cenas no especificados\nSeguro de viaje"}
          className="mt-1 bg-white/5 border-white/10 text-white min-h-[90px]"
        />
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
        <label className="text-amber-200 text-xs font-semibold flex items-center gap-2">
          <Plane className="h-4 w-4" /> Vuelos (solo referencia — tú compras manual)
        </label>
        <p className="text-white/40 text-xs">
          Filtra fechas disponibles según horarios de vuelo. La compra del pasaje la confirmas tú manualmente.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-white/40 text-xs">Origen (IATA)</label>
            <Input
              value={value.flightOrigin}
              onChange={(e) => patch({ flightOrigin: e.target.value.toUpperCase() })}
              placeholder="SCL"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-white/40 text-xs">Destino (IATA)</label>
            <Input
              value={value.flightDestination}
              onChange={(e) => patch({ flightDestination: e.target.value.toUpperCase() })}
              placeholder="IPC"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-white/40 text-xs">Tope vuelo ida + vuelta por persona (CLP)</label>
            <Input
              type="number"
              value={value.flightBudgetMax ?? ""}
              onChange={(e) => patch({ flightBudgetMax: e.target.value ? Number(e.target.value) : null })}
              placeholder="350000"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>
        <p className="text-white/40 text-xs">
          Solo se ofrecen fechas donde el vuelo ida+vuelta no supera este monto. El paquete ya incluye vuelo; si el cliente elige «Sin vuelo», se descuenta este valor del total (sin mostrarlo).
        </p>
      </div>

      <div>
        <label className="text-white/40 text-xs flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" /> PDF informativo
        </label>
        <div className="flex flex-wrap gap-2 mt-1 items-center">
          <Input
            value={value.pdfUrl}
            onChange={(e) => patch({ pdfUrl: e.target.value })}
            placeholder="/uploads/documento.pdf"
            className="flex-1 min-w-[200px] bg-white/5 border-white/10 text-white"
          />
          <label className="inline-flex items-center gap-2 cursor-pointer text-teal text-sm font-medium px-3 py-2 rounded-lg bg-teal/10">
            <Upload className="h-4 w-4" /> Subir PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f, (url) => patch({ pdfUrl: url }));
              }}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="text-white/40 text-xs">Galería (máx. {PACKAGE_GALLERY_MAX} fotos · se optimizan al subir)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {gallery.map((image, i) => (
            <div key={`${image.url}-${i}`} className="relative rounded-lg overflow-hidden bg-white/5 border border-white/10">
              <div className="relative aspect-video">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover"
                  style={{ objectPosition: image.objectPosition }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeGalleryPhoto(i)}
                className="absolute top-2 right-2 z-10 bg-red-600/90 hover:bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
              <div className="p-3 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-white/45 mb-1">
                    <span>Horizontal</span>
                    <span>{getGalleryPositionValue(image.objectPosition, "x")}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={getGalleryPositionValue(image.objectPosition, "x")}
                    onChange={(e) => updateGalleryPosition(i, "x", Number(e.target.value))}
                    className="w-full accent-teal"
                    aria-label="Posición horizontal de la foto"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] text-white/45 mb-1">
                    <span>Vertical</span>
                    <span>{getGalleryPositionValue(image.objectPosition, "y")}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={getGalleryPositionValue(image.objectPosition, "y")}
                    onChange={(e) => updateGalleryPosition(i, "y", Number(e.target.value))}
                    className="w-full accent-teal"
                    aria-label="Posición vertical de la foto"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = [...gallery];
                    next[i] = { ...next[i], objectPosition: "50% 50%" };
                    setGallery(next);
                  }}
                  className="h-7 w-full border-white/10 text-white bg-white/5 text-xs"
                >
                  Centrar
                </Button>
              </div>
            </div>
          ))}
          {gallery.length < PACKAGE_GALLERY_MAX && (
            <label className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer text-white/40 text-xs gap-1 hover:border-teal/40 hover:text-teal transition-colors">
              <Upload className="h-5 w-5" /> Agregar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void handleUpload(f, addGalleryPhoto);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <label className="text-teal-200 text-xs font-semibold">Tiene tours incluidos</label>
            <p className="text-white/40 text-xs mt-1">
              Tours que ya vienen en el paquete. El cliente los verá arriba al elegir sus tours.
            </p>
          </div>
          <Switch
            checked={optional.hasBundledIncluded === true}
            onCheckedChange={(checked) =>
              setBundledIncluded(checked, optional.bundledIncludedTours ?? [])
            }
          />
        </div>

        {optional.hasBundledIncluded && (
          <div className="space-y-3 pt-1">
            {(optional.bundledIncludedTours ?? []).map((tour, idx) => (
              <div key={tour.id} className="flex gap-3 p-3 bg-white/5 rounded-xl">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-white/10 shrink-0">
                  {tour.image && <Image src={tour.image} alt="" fill className="object-cover" />}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={tour.name}
                    onChange={(e) => {
                      const tours = [...(optional.bundledIncludedTours ?? [])];
                      tours[idx] = { ...tours[idx], name: e.target.value };
                      setBundledIncluded(true, tours);
                    }}
                    placeholder="Nombre del tour incluido (ej: Machu Picchu)"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Textarea
                    value={tour.description ?? ""}
                    onChange={(e) => {
                      const tours = [...(optional.bundledIncludedTours ?? [])];
                      tours[idx] = { ...tours[idx], description: e.target.value };
                      setBundledIncluded(true, tours);
                    }}
                    placeholder="Breve descripción (opcional)"
                    rows={2}
                    className="bg-white/5 border-white/10 text-white text-sm min-h-[52px] resize-y"
                  />
                  <label className="text-teal text-xs cursor-pointer inline-flex items-center gap-1">
                    <Upload className="h-3 w-3" /> Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        void handleUpload(f, (url) => {
                          const tours = [...(optional.bundledIncludedTours ?? [])];
                          tours[idx] = { ...tours[idx], image: url };
                          setBundledIncluded(true, tours);
                        });
                      }}
                    />
                  </label>
                </div>
                <div className="flex flex-col items-center gap-1 self-start">
                  <AdminReorderControls
                    index={idx}
                    total={(optional.bundledIncludedTours ?? []).length}
                    onMove={moveBundledIncludedTour}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setBundledIncluded(
                        true,
                        (optional.bundledIncludedTours ?? []).filter((_, i) => i !== idx),
                      )
                    }
                    className="text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setBundledIncluded(true, [
                  ...(optional.bundledIncludedTours ?? []),
                  { id: `bundled-${Date.now()}`, name: "", description: "", image: "" },
                ])
              }
              className="border-white/10 text-white bg-white/5"
            >
              <Plus className="h-4 w-4 mr-1" /> Agregar tour incluido
            </Button>
          </div>
        )}
      </div>

      <div>
        <label className="text-white/40 text-xs">Tours a elección</label>
        <div className="flex items-center gap-3 mt-1 mb-3">
          <span className="text-white/60 text-sm">Cantidad a elegir:</span>
          <Input
            type="number"
            min={0}
            max={Math.max(optional.options.length, 0)}
            value={optional.pickCount}
            onChange={(e) => {
              const raw = Number(e.target.value) || 0;
              const capped =
                optional.options.length > 0
                  ? Math.min(raw, optional.options.length)
                  : Math.max(0, raw);
              setOptional(capped, optional.options, optional.additionalActivities);
            }}
            className="w-24 bg-white/5 border-white/10 text-white"
          />
        </div>
        <p className="text-white/40 text-xs mt-1 mb-3">
          El cliente elige la cantidad indicada sin costo extra. Los no elegidos aparecen en el carrito con el precio configurado abajo.
          Usa las flechas para cambiar el orden en la ficha del paquete.
        </p>
        <div className="space-y-3">
          {optional.options.map((opt, idx) => (
            <div key={opt.id} className="flex gap-3 p-3 bg-white/5 rounded-xl">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-white/10 shrink-0">
                {opt.image && <Image src={opt.image} alt="" fill className="object-cover" />}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={opt.name}
                  onChange={(e) => {
                    const opts = [...optional.options];
                    opts[idx] = { ...opts[idx], name: e.target.value };
                    setOptional(optional.pickCount, opts, optional.additionalActivities);
                  }}
                  placeholder="Nombre del tour"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Textarea
                  value={opt.description ?? ""}
                  onChange={(e) => {
                    const opts = [...optional.options];
                    opts[idx] = { ...opts[idx], description: e.target.value };
                    setOptional(optional.pickCount, opts, optional.additionalActivities);
                  }}
                  placeholder="Breve descripción (1-2 líneas) — visible en la ficha del paquete"
                  rows={2}
                  className="bg-white/5 border-white/10 text-white text-sm min-h-[52px] resize-y"
                />
                <OptionalActivityPricingFields
                  value={opt}
                  onChange={(next) => {
                    const opts = [...optional.options];
                    opts[idx] = next;
                    setOptional(optional.pickCount, opts, optional.additionalActivities);
                  }}
                />
                <TourAddonsEditor
                  addons={opt.addons ?? []}
                  onChange={(addons) => {
                    const opts = [...optional.options];
                    opts[idx] = { ...opts[idx], addons };
                    setOptional(optional.pickCount, opts, optional.additionalActivities);
                  }}
                />
                <label className="text-teal text-xs cursor-pointer inline-flex items-center gap-1">
                  <Upload className="h-3 w-3" /> Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void handleUpload(f, (url) => {
                        const opts = [...optional.options];
                        opts[idx] = { ...opts[idx], image: url };
                        setOptional(optional.pickCount, opts, optional.additionalActivities);
                      });
                    }}
                  />
                </label>
              </div>
              <div className="flex flex-col items-center gap-1 self-start">
                <AdminReorderControls
                  index={idx}
                  total={optional.options.length}
                  onMove={moveOptionalTour}
                />
                <button
                  type="button"
                  onClick={() => setOptional(optional.pickCount, optional.options.filter((_, i) => i !== idx), optional.additionalActivities)}
                  className="text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setOptional(optional.pickCount, [
                ...optional.options,
                { id: `opt-${Date.now()}`, name: "", image: "", description: "", price: 0, priceVariesByPax: false },
              ], optional.additionalActivities)
            }
            className="border-white/10 text-white bg-white/5"
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar opción de tour
          </Button>
        </div>
      </div>

      <div>
        <label className="text-white/40 text-xs">Actividades adicionales (opcionales en el carrito)</label>
        <p className="text-white/40 text-xs mt-1 mb-3">
          Tours de pago en el carrito. Por defecto el precio es fijo; desmarca la casilla si cambia entre 1 y 2 personas.
        </p>
        <div className="space-y-3">
          {(optional.additionalActivities ?? []).map((act, idx) => (
            <div key={act.id} className="flex gap-3 p-3 bg-white/5 rounded-xl">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-white/10 shrink-0">
                {act.image && <Image src={act.image} alt="" fill className="object-cover" />}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={act.name}
                  onChange={(e) => {
                    const acts = [...(optional.additionalActivities ?? [])];
                    acts[idx] = { ...acts[idx], name: e.target.value };
                    setAdditionalActivities(acts);
                  }}
                  placeholder="Nombre de la actividad"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Textarea
                  value={act.description ?? ""}
                  onChange={(e) => {
                    const acts = [...(optional.additionalActivities ?? [])];
                    acts[idx] = { ...acts[idx], description: e.target.value };
                    setAdditionalActivities(acts);
                  }}
                  placeholder="Breve descripción (1-2 líneas) — visible en la ficha del paquete"
                  rows={2}
                  className="bg-white/5 border-white/10 text-white text-sm min-h-[52px] resize-y"
                />
                <OptionalActivityPricingFields
                  value={act}
                  onChange={(next) => {
                    const acts = [...(optional.additionalActivities ?? [])];
                    acts[idx] = next;
                    setAdditionalActivities(acts);
                  }}
                />
                <TourAddonsEditor
                  addons={act.addons ?? []}
                  onChange={(addons) => {
                    const acts = [...(optional.additionalActivities ?? [])];
                    acts[idx] = { ...acts[idx], addons };
                    setAdditionalActivities(acts);
                  }}
                />
                <label className="text-teal text-xs cursor-pointer inline-flex items-center gap-1">
                  <Upload className="h-3 w-3" /> Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void handleUpload(f, (url) => {
                        const acts = [...(optional.additionalActivities ?? [])];
                        acts[idx] = { ...acts[idx], image: url };
                        setAdditionalActivities(acts);
                      });
                    }}
                  />
                </label>
              </div>
              <div className="flex flex-col items-center gap-1 self-start">
                <AdminReorderControls
                  index={idx}
                  total={(optional.additionalActivities ?? []).length}
                  onMove={moveAdditionalActivity}
                />
                <button
                  type="button"
                  onClick={() => setAdditionalActivities((optional.additionalActivities ?? []).filter((_, i) => i !== idx))}
                  className="text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setAdditionalActivities([
                ...(optional.additionalActivities ?? []),
                { id: `extra-${Date.now()}`, name: "", image: "", description: "", price: 0, priceVariesByPax: false },
              ])
            }
            className="border-white/10 text-white bg-white/5"
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar actividad extra
          </Button>
        </div>
      </div>

      <div>
        <label className="text-white/40 text-xs">Preguntas frecuentes (5)</label>
        <div className="space-y-3 mt-2">
          {faqItems.map((item, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-xl space-y-2">
              <Input
                value={item.q}
                onChange={(e) => {
                  const next = [...faqItems];
                  next[i] = { ...next[i], q: e.target.value };
                  setFaq(next);
                }}
                placeholder={`Pregunta ${i + 1}`}
                className="bg-white/5 border-white/10 text-white"
              />
              <Textarea
                value={item.a}
                onChange={(e) => {
                  const next = [...faqItems];
                  next[i] = { ...next[i], a: e.target.value };
                  setFaq(next);
                }}
                placeholder="Respuesta"
                className="bg-white/5 border-white/10 text-white min-h-[60px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionalActivityPricingFields({
  value,
  onChange,
}: {
  value: OptionalTourOption;
  onChange: (next: OptionalTourOption) => void;
}) {
  const varies = value.priceVariesByPax === true;

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!varies}
          onChange={(e) =>
            onChange({
              ...value,
              priceVariesByPax: !e.target.checked,
              price1Pax: e.target.checked ? undefined : (value.price1Pax ?? value.price ?? 0),
              price2Pax: e.target.checked ? undefined : (value.price2Pax ?? value.price ?? 0),
            })
          }
          className="mt-0.5 rounded"
        />
        <span className="text-white/70 text-xs leading-relaxed">
          El valor <strong className="text-white">no varía</strong> por cantidad de personas (precio fijo de la actividad)
        </span>
      </label>

      {!varies ? (
        <div>
          <label className="text-white/40 text-xs">Precio fijo (CLP)</label>
          <Input
            type="number"
            min={0}
            value={value.price ?? ""}
            onChange={(e) =>
              onChange({ ...value, price: e.target.value ? Number(e.target.value) : 0 })
            }
            placeholder="Ej: 45000"
            className="mt-1 bg-white/5 border-white/10 text-white"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-white/40 text-xs">1 persona / persona (CLP)</label>
            <Input
              type="number"
              min={0}
              value={value.price1Pax ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  price1Pax: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-white/40 text-xs">2+ personas / persona (CLP)</label>
            <Input
              type="number"
              min={0}
              value={value.price2Pax ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  price2Pax: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TourAddonsEditor({
  addons,
  onChange,
}: {
  addons: TourAddon[];
  onChange: (addons: TourAddon[]) => void;
}) {
  return (
    <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
      <p className="text-white/40 text-xs">
        Complementos opcionales al elegir este tour (ej: cena +$45.000)
      </p>
      {addons.map((addon, aidx) => (
        <div key={addon.id} className="flex gap-2 items-center">
          <Input
            value={addon.name}
            onChange={(e) => {
              const next = [...addons];
              next[aidx] = { ...next[aidx], name: e.target.value };
              onChange(next);
            }}
            placeholder="Nombre (ej: Cena)"
            className="bg-white/5 border-white/10 text-white flex-1"
          />
          <Input
            type="number"
            min={0}
            value={addon.price || ""}
            onChange={(e) => {
              const next = [...addons];
              next[aidx] = { ...next[aidx], price: e.target.value ? Number(e.target.value) : 0 };
              onChange(next);
            }}
            placeholder="45000"
            className="bg-white/5 border-white/10 text-white w-28"
          />
          <button
            type="button"
            onClick={() => onChange(addons.filter((_, i) => i !== aidx))}
            className="text-red-400 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onChange([...addons, { id: `addon-${Date.now()}`, name: "", price: 0 }]);
        }}
        className="border-white/10 text-white bg-white/5 h-8 text-xs"
      >
        <Plus className="h-3 w-3 mr-1" /> Complemento
      </Button>
    </div>
  );
}

export function emptyPackageContent(): PackageContentState {
  return {
    includesText: "",
    excludesText: "",
    highlightsText: "",
    pdfUrl: "",
    galleryJson: "[]",
    faqJson: defaultFaqJson(),
    optionalToursJson: JSON.stringify({ pickCount: 0, options: [], additionalActivities: [] }),
    flightOrigin: "SCL",
    flightDestination: "",
    flightBudgetMax: null,
  };
}
