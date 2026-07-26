"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Pencil, Upload, Eye, EyeOff, Percent, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { UploadAwareImage } from "@/components/UploadAwareImage";

import { PackageContentFields, emptyPackageContent, type PackageContentState } from "@/components/admin/PackageContentFields";
import { PackagePricingFields } from "@/components/admin/PackagePricingFields";
import {
  getDefaultPricing,
  getListDisplayPricePerPerson,
  ensureOccupancyTiers,
  syncPricingFromAccommodations,
  usesAccommodationPricing,
  clonePricingForDuplicate,
  clampPromoDiscountPercent,
  applyPromoPercent,
  type TourPricingConfig,
} from "@/lib/tour-pricing";
import { TOUR_CATEGORIES, normalizeTourCategory, tourCategoryLabel } from "@/lib/tour-category";
import { isGroupTourId } from "@/lib/tour-pricing";

export type TourRecord = {
  tourId: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  tag: string;
  category: string;
  price: number;
  originalPrice: number | null;
  duration: string;
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
  taxType: string;
  minDepositPerPerson: number;
  showInOfertas: boolean;
  promoTitle: string;
  promoDiscountPercent: number;
  active: boolean;
  sortOrder: number;
};

const emptyTour = (): Partial<TourRecord> & { tourId: string } => ({
  tourId: "",
  name: "",
  subtitle: "",
  description: "",
  image: "/images/atacama-new.png",
  tag: "",
  category: "nacional",
  price: 0,
  originalPrice: null,
  duration: "7 dias / 6 noches",
  ...emptyPackageContent(),
  taxType: "exento",
  minDepositPerPerson: 0,
  showInOfertas: false,
  promoTitle: "",
  promoDiscountPercent: 0,
  active: true,
  sortOrder: 99,
});

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, credentials: "include" });
}

function authErrorMessage(res: Response, data?: { error?: string }) {
  if (res.status === 401) {
    return "Sesión de administrador expirada o inválida. Cierra el panel, inicia sesión de nuevo con tu cuenta admin y vuelve a guardar.";
  }
  return data?.error ?? "Error al guardar";
}

function suggestDuplicateTourId(sourceId: string, existingIds: string[]): string {
  const base = sourceId.replace(/-copy(-\d+)?$/i, "");
  const taken = new Set(existingIds);
  let candidate = `${base}-copy`;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-copy-${n}`;
    n += 1;
  }
  return candidate;
}

/** Paquetes individuales: sin viajes grupales (van en la pestaña Viajes grupales). */
const PACKAGE_CATEGORIES = TOUR_CATEGORIES.filter((c) => c.value !== "grupal").map((c) => ({
  value: c.value,
  label: c.label,
}));

function isGroupTripPackage(tour: { tourId: string; category?: string }) {
  return isGroupTourId(tour.tourId) || normalizeTourCategory(tour.category ?? "", tour.tourId) === "grupal";
}

export function PackagesAdmin() {
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [editing, setEditing] = useState<(Partial<TourRecord> & { tourId: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<TourPricingConfig | null>(null);

  const loadPricing = async (tourId: string, tourName: string, basePrice: number, promoPercent = 0) => {
    try {
      const res = await fetch(`/api/tours/pricing?tourId=${encodeURIComponent(tourId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setPricingConfig({
            ...ensureOccupancyTiers(data.config, basePrice),
            promoDiscountPercent: clampPromoDiscountPercent(
              data.config.promoDiscountPercent ?? promoPercent,
            ),
          });
          return;
        }
      }
    } catch { /* defaults */ }
    setPricingConfig({
      ...getDefaultPricing(tourId, tourName, basePrice),
      promoDiscountPercent: clampPromoDiscountPercent(promoPercent),
    });
  };

  useEffect(() => {
    if (!editing) {
      setPricingConfig(null);
      return;
    }
    if (isNew) {
      if (editing.name?.includes("(copia)")) return;
      setPricingConfig((prev) => {
        if (prev?.tourId === editing.tourId) return prev;
        return getDefaultPricing(editing.tourId, editing.name ?? "", editing.price ?? 0);
      });
      return;
    }
    if (editing.tourId) {
      void loadPricing(
        editing.tourId,
        editing.name ?? "",
        editing.price ?? 0,
        editing.promoDiscountPercent ?? 0,
      );
    }
    // Solo al abrir/cambiar paquete — no recargar si editing.price cambia al editar precios
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intencional: no depender de todo `editing`
  }, [editing?.tourId, isNew]);

  const load = async () => {
    const res = await adminFetch("/api/admin/tours");
    if (res.status === 401) {
      toast.error(authErrorMessage(res));
      return;
    }
    const data = await res.json();
    const all = (data.tours ?? []) as TourRecord[];
    setTours(all.filter((t) => !isGroupTripPackage(t)));
  };

  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminFetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditing((e) => e ? { ...e, image: data.url } : e);
      toast.success("Imagen subida");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const applyDiscountPercent = (rawPercent: number) => {
    if (!editing || !pricingConfig) return;
    const percent = clampPromoDiscountPercent(rawPercent);
    // Solo guarda el %: los precios de hoteles NO se tocan.
    const nextConfig = { ...pricingConfig, promoDiscountPercent: percent };
    setPricingConfig(nextConfig);
    setEditing({
      ...editing,
      promoDiscountPercent: percent,
      tag: percent > 0 ? `${percent}% OFF` : (editing.tag?.includes("% OFF") ? "" : editing.tag),
    });
  };

  const handlePricingChange = (config: TourPricingConfig) => {
    const percent = clampPromoDiscountPercent(editing?.promoDiscountPercent);
    const synced = usesAccommodationPricing(config)
      ? syncPricingFromAccommodations(config)
      : config;
    const withPromo = { ...synced, promoDiscountPercent: percent };
    setPricingConfig(withPromo);
    // El precio de lista del tour se deriva de hoteles; el de oferta se calcula al guardar.
    const listPrice = getListDisplayPricePerPerson(withPromo);
    setEditing((e) => (e ? { ...e, price: listPrice } : e));
  };

  const savePricing = async (tourId: string, tourName: string, config: TourPricingConfig) => {
    const normalized = ensureOccupancyTiers(config, config.basePrice);
    const synced = usesAccommodationPricing(normalized)
      ? syncPricingFromAccommodations(normalized)
      : normalized;
    const percent = clampPromoDiscountPercent(editing?.promoDiscountPercent);
    const listPrice = getListDisplayPricePerPerson(synced);
    const salePrice = applyPromoPercent(listPrice, percent);
    const { promoDiscountPercent: _promo, ...configToSave } = synced;
    const res = await adminFetch("/api/admin/tour-pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tourId,
        tourName,
        basePrice: listPrice,
        config: {
          passengerPrices: configToSave.passengerPrices,
          occupancyPricing: configToSave.occupancyPricing,
          accommodations: configToSave.accommodations,
          tiers: configToSave.tiers,
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(authErrorMessage(res, data));
    }
    return { listPrice, salePrice, percent };
  };

  const save = async () => {
    if (!editing?.tourId?.trim() || !editing.name?.trim()) {
      toast.error("ID y nombre son obligatorios");
      return;
    }

    if (editing.showInOfertas && !editing.promoTitle?.trim()) {
      toast.error("Si el paquete es visible en Ofertas, el título de la oferta es obligatorio");
      return;
    }

    const slug = editing.tourId.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slug) {
      toast.error("El ID del paquete solo puede usar letras, números y guiones");
      return;
    }

    if (isNew && tours.some((t) => t.tourId === slug)) {
      toast.error(`El ID "${slug}" ya existe. Cambia el slug antes de guardar (ej. ${slug}-2).`);
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? "/api/admin/tours" : `/api/admin/tours/${editing.tourId}`;
      const method = isNew ? "POST" : "PUT";

      const percent = editing.showInOfertas
        ? clampPromoDiscountPercent(editing.promoDiscountPercent)
        : 0;
      const listPrice = pricingConfig
        ? getListDisplayPricePerPerson(pricingConfig)
        : Number(editing.price) || 0;
      const salePrice = applyPromoPercent(listPrice, percent);

      // En DB: price = lo que ve el cliente; originalPrice = tachado si hay %.
      // Los hoteles guardan siempre el precio real (lista).
      const payload = {
        ...editing,
        tourId: slug,
        promoDiscountPercent: percent,
        price: percent > 0 ? salePrice : listPrice,
        originalPrice: percent > 0 ? listPrice : (editing.originalPrice ?? null),
        tag: percent > 0 ? `${percent}% OFF` : (editing.tag ?? ""),
      };

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(authErrorMessage(res, data));
      }

      if (pricingConfig) {
        await savePricing(slug, editing.name.trim(), {
          ...pricingConfig,
          tourId: slug,
          tourName: editing.name.trim(),
        });
      }

      toast.success(isNew ? "Paquete creado" : "Paquete actualizado — cierra el panel para ver los cambios en la web");
      setEditing(null);
      setIsNew(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (tourId: string) => {
    if (!confirm("¿Eliminar este paquete permanentemente?")) return;
    try {
      const res = await adminFetch(`/api/admin/tours/${tourId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Paquete eliminado");
      if (editing?.tourId === tourId) setEditing(null);
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const toggleActive = async (tour: TourRecord) => {
    await adminFetch(`/api/admin/tours/${tour.tourId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tour, active: !tour.active }),
    });
    load();
  };

  const duplicateTour = async (source: TourRecord) => {
    const newId = suggestDuplicateTourId(source.tourId, tours.map((t) => t.tourId));
    const copy: Partial<TourRecord> & { tourId: string } = {
      ...source,
      tourId: newId,
      name: `${source.name} (copia)`,
      active: false,
      sortOrder: Math.max(0, ...tours.map((t) => t.sortOrder)) + 1,
    };

    const fallbackPrice = copy.price ?? source.price ?? 0;
    let config: TourPricingConfig;

    const useInMemoryPricing =
      pricingConfig &&
      pricingConfig.tourId === source.tourId &&
      editing?.tourId === source.tourId;

    if (useInMemoryPricing) {
      config = clonePricingForDuplicate(
        pricingConfig,
        newId,
        copy.name ?? "",
        fallbackPrice,
      );
    } else {
      config = getDefaultPricing(newId, copy.name ?? "", fallbackPrice);
      try {
        const res = await fetch(`/api/tours/pricing?tourId=${encodeURIComponent(source.tourId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            config = clonePricingForDuplicate(
              data.config as Partial<TourPricingConfig>,
              newId,
              copy.name ?? "",
              fallbackPrice,
            );
          }
        }
      } catch {
        /* precios por defecto */
      }
    }

    setPricingConfig(config);
    setIsNew(true);
    setEditing(copy);
    toast.message("Paquete duplicado — revisa el ID, alojamientos y nombre, luego guarda");
  };

  const isDuplicateDraft = isNew && Boolean(editing?.name?.includes("(copia)"));

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">
            {isDuplicateDraft ? `Duplicar: ${editing.name?.replace(/\s*\(copia\)\s*$/i, "")}` : isNew ? "Nuevo paquete" : `Editar: ${editing.name}`}
          </h3>
          <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}
            className="bg-white/5 border-white/10 text-white">Cancelar</Button>
        </div>

        <Card className="bg-navy-light border-white/5 rounded-2xl">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="relative h-40 w-full sm:w-56 rounded-xl overflow-hidden bg-white/5 shrink-0">
                {editing.image && (
                  <UploadAwareImage src={editing.image} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <label className="text-white/50 text-xs">Foto del paquete</label>
                <Input value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="/images/mi-foto.png o /uploads/..."
                  className="bg-white/5 border-white/10 text-white" />
                <label className="inline-flex items-center gap-2 cursor-pointer text-teal text-sm font-medium">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir imagen desde PC"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-white/40 text-xs">ID único (slug)</label>
                <Input value={editing.tourId} disabled={!isNew}
                  onChange={(e) => setEditing({ ...editing, tourId: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
                {isNew && (
                  <p className="text-white/35 text-xs mt-1">
                    Debe ser único. Ej: rapa-nui-7d
                  </p>
                )}
              </div>
              <div>
                <label className="text-white/40 text-xs">Nombre *</label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/40 text-xs">Subtítulo / ubicación</label>
                <Input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/40 text-xs">Etiqueta (tag)</label>
                <Input value={editing.tag ?? ""} onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/40 text-xs">Categoría</label>
                <select
                  value={normalizeTourCategory(editing.category ?? "nacional", editing.tourId)}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm">
                  {PACKAGE_CATEGORIES.map((c) => <option key={c.value} value={c.value} className="text-black">{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs">Duración</label>
                <Input value={editing.duration ?? ""} onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-white/40 text-xs">Tipo tributario</label>
                <select value={editing.taxType ?? "exento"}
                  onChange={(e) => setEditing({ ...editing, taxType: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md bg-white/5 border border-white/10 text-white px-3 text-sm">
                  <option value="exento" className="text-black">Exento (internacional / exportación servicios)</option>
                  <option value="afecto" className="text-black">Afecto IVA 19% (nacional Chile)</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs">Abono mínimo por persona (CLP)</label>
                <Input type="number" min={0} value={editing.minDepositPerPerson ?? 0}
                  onChange={(e) => setEditing({ ...editing, minDepositPerPerson: Number(e.target.value) || 0 })}
                  className="mt-1 bg-white/5 border-white/10 text-white" />
                <p className="text-white/30 text-[10px] mt-1">
                  Monto mínimo para &quot;Reservar con el mínimo&quot;. 0 = solo pago total.
                </p>
              </div>
            </div>

            <div>
              <label className="text-white/40 text-xs">Descripción</label>
              <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white min-h-[80px]" />
              <p className="text-white/30 text-[10px] mt-1">
                Los saltos de línea y espacios se respetan tal cual en la web.
              </p>
            </div>

            <PackageContentFields
              value={{
                includesText: editing.includesText ?? "",
                excludesText: editing.excludesText ?? "",
                highlightsText: editing.highlightsText ?? "",
                pdfUrl: editing.pdfUrl ?? "",
                galleryJson: editing.galleryJson ?? "[]",
                faqJson: editing.faqJson ?? "[]",
                optionalToursJson: editing.optionalToursJson ?? "{\"pickCount\":0,\"options\":[]}",
                flightOrigin: editing.flightOrigin ?? "SCL",
                flightDestination: editing.flightDestination ?? "",
                flightBudgetMax: editing.flightBudgetMax ?? null,
              }}
              onChange={(content: PackageContentState) => setEditing({ ...editing, ...content })}
            />

            <div className="p-4 bg-white/5 rounded-xl space-y-4">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Percent className="h-4 w-4 text-teal" /> Precio en la página principal
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/40 text-xs">
                    Precio real &quot;Desde&quot; (2 personas) — no cambia con la oferta
                  </label>
                  <div className="mt-1 h-10 flex items-center px-3 rounded-md bg-white/5 border border-white/10 text-teal font-bold">
                    {formatCLP(
                      pricingConfig
                        ? getListDisplayPricePerPerson(pricingConfig)
                        : (editing.price ?? 0),
                    )}
                  </div>
                  <p className="text-white/30 text-[10px] mt-1">
                    Sale del hotel más económico (precio que editas abajo). Las promociones no lo modifican.
                  </p>
                </div>
                {!editing.showInOfertas || clampPromoDiscountPercent(editing.promoDiscountPercent) <= 0 ? (
                  <div>
                    <label className="text-white/40 text-xs">Precio tachado manual (opcional)</label>
                    <Input
                      type="number"
                      value={editing.originalPrice ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          originalPrice: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                    <p className="text-white/30 text-[10px] mt-1">
                      Solo si quieres un tachado sin usar % de oferta.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-amber-200 text-xs font-semibold mb-2">
                      Vista oferta ({clampPromoDiscountPercent(editing.promoDiscountPercent)}% OFF)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wide">Antes</p>
                        <p className="text-white/50 line-through font-medium">
                          {formatCLP(
                            pricingConfig
                              ? getListDisplayPricePerPerson(pricingConfig)
                              : (editing.price ?? 0),
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wide">Después</p>
                        <p className="text-amber-300 font-bold text-lg">
                          {formatCLP(
                            pricingConfig
                              ? applyPromoPercent(
                                  getListDisplayPricePerPerson(pricingConfig),
                                  editing.promoDiscountPercent,
                                )
                              : applyPromoPercent(editing.price ?? 0, editing.promoDiscountPercent),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.showInOfertas)}
                    onChange={(e) => {
                      const on = e.target.checked;
                      if (!on) {
                        setEditing({
                          ...editing,
                          showInOfertas: false,
                          promoTitle: "",
                          promoDiscountPercent: 0,
                          tag: editing.tag?.includes("% OFF") ? "" : editing.tag,
                        });
                        if (pricingConfig) {
                          setPricingConfig({ ...pricingConfig, promoDiscountPercent: 0 });
                        }
                        return;
                      }
                      setEditing({
                        ...editing,
                        showInOfertas: true,
                        promoTitle: editing.promoTitle ?? "",
                        promoDiscountPercent: editing.promoDiscountPercent ?? 0,
                      });
                    }}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 accent-teal"
                  />
                  <span>
                    <span className="text-white font-medium text-sm">Visible en sector Ofertas</span>
                    <span className="block text-white/40 text-xs mt-0.5">
                      Aparece en Ofertas de la home. El nombre del programa pasa a ser el subtítulo.
                    </span>
                  </span>
                </label>
                {editing.showInOfertas ? (
                  <div className="space-y-3 pl-7">
                    <div>
                      <label className="text-white/40 text-xs">Título de la oferta *</label>
                      <Input
                        value={editing.promoTitle ?? ""}
                        onChange={(e) => setEditing({ ...editing, promoTitle: e.target.value })}
                        placeholder="Ej: Destino del Mes JULIO"
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                      <p className="text-white/30 text-[10px] mt-1">
                        Subtítulo en la web: <span className="text-white/50">{editing.name || "nombre del programa"}</span>
                      </p>
                    </div>
                    <div>
                      <label className="text-white/70 text-xs font-medium">
                        % de descuento temporal (no modifica precios de hoteles)
                      </label>
                      <p className="text-white/40 text-[10px] mt-0.5 mb-2">
                        Los precios que editas en cada hotel siguen siendo los reales. Solo cambia lo que ve el cliente mientras la oferta esté activa.
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {[5, 10, 15, 20, 25, 30].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => applyDiscountPercent(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              clampPromoDiscountPercent(editing.promoDiscountPercent) === p
                                ? "bg-amber-500 text-navy"
                                : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            }`}
                          >
                            -{p}%
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => applyDiscountPercent(0)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs font-bold hover:bg-white/15"
                        >
                          Sin %
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-white/50 text-xs">Otro %:</span>
                        <Input
                          type="number"
                          min={1}
                          max={90}
                          placeholder="Ej: 12"
                          className="w-24 h-9 bg-white/5 border-white/10 text-white"
                          value={
                            [5, 10, 15, 20, 25, 30].includes(
                              clampPromoDiscountPercent(editing.promoDiscountPercent),
                            )
                              ? ""
                              : editing.promoDiscountPercent || ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              applyDiscountPercent(0);
                              return;
                            }
                            applyDiscountPercent(Number(v));
                          }}
                        />
                      </div>
                      {pricingConfig && clampPromoDiscountPercent(editing.promoDiscountPercent) > 0 ? (
                        <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-amber-500/40 bg-navy/40 p-3">
                          <div>
                            <p className="text-white/40 text-[10px] uppercase">Antes (precio real)</p>
                            <p className="text-white/60 line-through text-lg font-semibold">
                              {formatCLP(getListDisplayPricePerPerson(pricingConfig))}
                            </p>
                          </div>
                          <div>
                            <p className="text-amber-200/80 text-[10px] uppercase">Después (con oferta)</p>
                            <p className="text-amber-300 text-lg font-black">
                              {formatCLP(
                                applyPromoPercent(
                                  getListDisplayPricePerPerson(pricingConfig),
                                  editing.promoDiscountPercent,
                                ),
                              )}
                            </p>
                          </div>
                          <p className="col-span-2 text-white/35 text-[10px]">
                            Aplica a todos los hoteles y a 1, 2, 3 o más personas. Al quitar el %, vuelven los precios reales.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {pricingConfig && (
              <PackagePricingFields config={pricingConfig} onChange={handlePricingChange} />
            )}

            <div className="flex gap-3">
              <Button onClick={save} disabled={saving} className="bg-teal text-navy font-bold flex-1">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : isNew ? "Crear paquete" : "Guardar paquete"}
              </Button>
              {!isNew && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void duplicateTour(editing as TourRecord)}
                  className="bg-white/5 border-white/10 text-white"
                  title="Duplicar este paquete"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {!isNew && (
                <Button onClick={() => remove(editing.tourId)} variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-sm">{tours.length} paquetes · Edita precios, fotos y elimina desde aquí</p>
        <Button onClick={() => { setEditing(emptyTour()); setIsNew(true); }}
          className="bg-teal text-navy font-bold">
          <Plus className="h-4 w-4 mr-2" /> Nuevo paquete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tours.map((tour) => (
          <Card key={tour.tourId} className={`bg-navy-light border-white/5 rounded-2xl overflow-hidden ${!tour.active ? "opacity-50" : ""}`}>
            <div className="relative h-36">
              <UploadAwareImage src={tour.image} alt={tour.name} fill className="object-cover" />
              {!tour.active && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Oculto</span>
              )}
              {tour.showInOfertas && (
                <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  Ofertas{tour.promoDiscountPercent > 0 ? ` −${tour.promoDiscountPercent}%` : ""}
                </span>
              )}
            </div>
            <CardContent className="p-4">
              <h4 className="text-white font-bold">{tour.name}</h4>
              {tour.showInOfertas && tour.promoTitle ? (
                <p className="text-amber-300/90 text-xs mt-0.5">Oferta: {tour.promoTitle}</p>
              ) : null}
              <p className="text-white/40 text-xs">{tour.tourId} · {tourCategoryLabel(tour.category, tour.tourId)}</p>
              <div className="flex items-baseline gap-2 mt-2">
                {tour.originalPrice && (
                  <span className="text-white/30 line-through text-sm">{formatCLP(tour.originalPrice)}</span>
                )}
                <span className="text-teal font-bold text-lg">{formatCLP(tour.price)}</span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button size="sm" onClick={() => { setEditing({ ...tour }); setIsNew(false); }}
                  className="flex-1 min-w-[100px] bg-white/10 hover:bg-white/20 text-white">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" onClick={() => void duplicateTour(tour)}
                  className="bg-teal/20 hover:bg-teal/30 text-teal border border-teal/30"
                  title="Duplicar paquete">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(tour)}
                  className="bg-white/5 border-white/10 text-white">
                  {tour.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(tour.tourId)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
