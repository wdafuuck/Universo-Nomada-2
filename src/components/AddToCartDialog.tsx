"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import {
  Minus, Plus, ShoppingCart, Users, Calendar, Building2, Loader2,
  CheckCircle2, XCircle, Plane, ChevronRight, ChevronLeft, MapPin, Gift,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnnouncer } from "@/contexts/AnnouncerContext";
import { useTourPricing } from "@/hooks/use-tour-pricing";
import {
  calculateTourTotal,
  getDisplayPricePerPerson,
  getEffectivePassengerPrices,
  getRoomOptionsForTour,
  isGroupTourId,
  payingPassengers,
  sortAccommodationsByPrice,
  totalPassengers,
  type PassengerCounts,
  type Accommodation,
} from "@/lib/tour-pricing";
import type { HotelAvailabilityStatus } from "@/lib/hotel-availability";
import { resolveAvailabilityProvider } from "@/lib/resolve-availability-provider";
import { getRoomLabel } from "@/lib/room-options";
import { useCartStore, type TravelerDetail } from "@/stores/cart-store";
import { trackAddToCart } from "@/lib/analytics-events";
import type { TourForCart } from "@/contexts/CartContext";
import { checkOutFromCheckIn, parseTourDuration } from "@/lib/tour-duration";
import { AvailabilityDisclaimer } from "@/components/AvailabilityDisclaimer";
import { HotelStars } from "@/components/HotelStars";
import { CartStepIndicator } from "@/components/cart/CartStepIndicator";
import { TourDatePicker, formatTourDateEs } from "@/components/TourDatePicker";
import { SteppedDatePicker } from "@/components/SteppedDatePicker";
import { PhoneInput, formatFullPhone, DEFAULT_PHONE_COUNTRY } from "@/components/PhoneInput";
import { getPhoneCountry } from "@/lib/phone-countries";
import {
  findOptionalTourById,
  visibleTourAddons,
  visibleBundledIncludedTours,
  calculateOptionalTourExtraPrice,
  getOptionalTourExtraPerPersonLabel,
  type OptionalToursConfig,
  type OptionalTourOption,
} from "@/lib/tour-content";
import { BundledIncludedToursBanner } from "@/components/package/BundledIncludedToursBanner";
import { getStoredRoulettePrize } from "@/lib/roulette-client";

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

type CartFlowStep = "passengers" | "flights" | "accommodation" | "includedTours" | "extras" | "checkout";

const emptyTraveler = (): TravelerDetail => ({
  fullName: "", documentId: "", birthDate: "", documentExpiry: "",
});

type Props = {
  tour: TourForCart | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
};

type AvailMap = Record<string, HotelAvailabilityStatus>;

export function AddToCartDialog({ tour, open, onOpenChange, onAdded }: Props) {
  const { language, t } = useLanguage();
  const { announce } = useAnnouncer();
  const c = t("cart");
  const addItem = useCartStore((s) => s.addItem);
  const config = useTourPricing(tour?.tourId ?? "", tour?.tourName ?? "", tour?.basePrice);
  const isGroupTrip = tour ? isGroupTourId(tour.tourId) : false;
  const showDates = !isGroupTrip;
  const displayPrice = getDisplayPricePerPerson(config);

  const [stepIndex, setStepIndex] = useState(0);
  const [optionalConfig, setOptionalConfig] = useState<OptionalToursConfig>({
    pickCount: 0,
    options: [],
    additionalActivities: [],
  });
  const [selectedIncludedTours, setSelectedIncludedTours] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedTourAddons, setSelectedTourAddons] = useState<Record<string, string[]>>({});
  const [extrasForAllPassengers, setExtrasForAllPassengers] = useState(true);
  const [extraPassengerCounts, setExtraPassengerCounts] = useState<Record<string, number>>({});
  const [passengers, setPassengers] = useState<PassengerCounts>({
    adults: 2, children: 0, infants: 0, seniors: 0,
  });
  const [checkIn, setCheckIn] = useState("");
  const [durationRaw, setDurationRaw] = useState("");
  const parsedDuration = useMemo(() => parseTourDuration(durationRaw), [durationRaw]);
  const checkOut = checkIn ? checkOutFromCheckIn(checkIn, durationRaw) : "";

  const [validatingDate, setValidatingDate] = useState(false);
  const [flightContactAccepted, setFlightContactAccepted] = useState(false);

  const [accommodationId, setAccommodationId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availability, setAvailability] = useState<AvailMap>({});
  const [availSource, setAvailSource] = useState<"live" | "manual" | null>(null);

  const [travelers, setTravelers] = useState<TravelerDetail[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneLocal, setContactPhoneLocal] = useState("");
  const [contactPhoneCountry, setContactPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [rouletteGiftTourId, setRouletteGiftTourId] = useState("");

  const rouletteTourGift = useMemo(() => {
    if (!open) return null;
    const stored = getStoredRoulettePrize();
    return stored?.prize === "tour_regalo" ? stored : null;
  }, [open]);

  const total = totalPassengers(passengers);
  const activeAccommodations = useMemo(
    () =>
      sortAccommodationsByPrice(
        config.accommodations.filter((a) => a.active),
        config,
        passengers,
      ),
    [config, passengers],
  );
  const hasAccommodations = activeAccommodations.length > 0;

  const hasIncludedToursStep =
    optionalConfig.pickCount > 0 && optionalConfig.options.length > 0;
  const bundledIncludedTours = useMemo(
    () => visibleBundledIncludedTours(optionalConfig),
    [optionalConfig],
  );
  const extrasCatalog = useMemo(() => {
    const dedicated = (optionalConfig.additionalActivities ?? []).filter((a) => a.name.trim());
    const fromOptions = optionalConfig.options.filter(
      (o) => o.name.trim() && !selectedIncludedTours.includes(o.id),
    );
    const dedicatedIds = new Set(dedicated.map((d) => d.id));
    return [
      ...fromOptions.filter((o) => !dedicatedIds.has(o.id)),
      ...dedicated,
    ];
  }, [optionalConfig.options, optionalConfig.additionalActivities, selectedIncludedTours]);

  const hasExtrasStep = extrasCatalog.length > 0;

  const flowSteps = useMemo<CartFlowStep[]>(() => {
    const keys: CartFlowStep[] = ["passengers"];
    if (showDates) keys.push("flights");
    keys.push("accommodation");
    if (hasIncludedToursStep) keys.push("includedTours");
    if (hasExtrasStep) keys.push("extras");
    keys.push("checkout");
    return keys;
  }, [hasIncludedToursStep, hasExtrasStep, showDates]);

  const currentStep = flowSteps[stepIndex] ?? "passengers";

  const steps = useMemo(
    () =>
      flowSteps.map((key, i) => ({
        id: i + 1,
        label:
          key === "passengers"
            ? (c.stepPassengers ?? "Pasajeros")
            : key === "flights"
              ? (c.stepFlights ?? "Vuelos")
              : key === "accommodation"
                ? (c.stepAccommodation ?? "Alojamiento")
                : key === "includedTours"
                  ? (c.stepIncludedTours ?? "Tours")
                  : key === "extras"
                    ? (c.stepExtras ?? "Extras")
                    : (c.stepCheckout ?? "Comprar"),
      })),
    [flowSteps, c],
  );

  const getExtraTourPassengers = useCallback(
    (extraId: string) => (extrasForAllPassengers ? total : (extraPassengerCounts[extraId] ?? total)),
    [extrasForAllPassengers, extraPassengerCounts, total],
  );

  const extrasPrice = useMemo(
    () =>
      selectedExtras.reduce((sum, id) => {
        const act = extrasCatalog.find((a) => a.id === id);
        if (!act) return sum;
        return sum + calculateOptionalTourExtraPrice(act, getExtraTourPassengers(id));
      }, 0),
    [selectedExtras, extrasCatalog, getExtraTourPassengers],
  );

  const addonsPrice = useMemo(() => {
    const activeTourIds = new Set([...selectedIncludedTours, ...selectedExtras]);
    let sum = 0;
    for (const [tourId, addonIds] of Object.entries(selectedTourAddons)) {
      if (!activeTourIds.has(tourId)) continue;
      const tour = findOptionalTourById(optionalConfig, tourId);
      if (!tour?.addons?.length) continue;
      const pax = selectedExtras.includes(tourId) ? getExtraTourPassengers(tourId) : total;
      for (const addonId of addonIds) {
        const addon = tour.addons.find((a) => a.id === addonId);
        if (addon) sum += addon.price * pax;
      }
    }
    return sum;
  }, [selectedTourAddons, selectedIncludedTours, selectedExtras, optionalConfig, total, getExtraTourPassengers]);

  const selectedAvailability = accommodationId ? availability[accommodationId] : undefined;
  const accommodationSurchargeTotal =
    selectedAvailability?.surchargePerPerson && selectedAvailability.surchargePerPerson > 0
      ? selectedAvailability.surchargePerPerson * payingPassengers(passengers)
      : 0;

  const baseTotal = tour ? calculateTourTotal(config, passengers, accommodationId || undefined) : 0;
  const totalPrice = baseTotal + extrasPrice + addonsPrice + accommodationSurchargeTotal;

  const availableAccommodations = useMemo(() => {
    if (!checkIn || !checkOut) return activeAccommodations;
    return activeAccommodations.filter((acc) => {
      const provider = resolveAvailabilityProvider(acc);
      if (provider === "manual") return true;
      const status = availability[acc.id];
      if (!status) return true;
      return status.available;
    });
  }, [activeAccommodations, checkIn, checkOut, availability]);

  const roomOptions = useMemo(
    () => (!hasAccommodations && tour ? getRoomOptionsForTour(config, total) : []),
    [config, tour, total, hasAccommodations],
  );

  const checkAvailability = useCallback(async () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return;
    const withApi = activeAccommodations.filter((a) => resolveAvailabilityProvider(a) !== "manual");
    if (!withApi.length) { setAvailSource("manual"); return; }
    setCheckingAvail(true);
    try {
      const res = await fetch("/api/hotels/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          adults: passengers.adults + passengers.seniors,
          children: passengers.children,
          accommodations: withApi.map((a) => ({
            id: a.id,
            provider: resolveAvailabilityProvider(a),
            bookingPropertyId: a.bookingPropertyId,
            liteapiHotelId: a.liteapiHotelId,
            liteapiMaxPriceUsd: a.liteapiMaxPriceUsd,
            ratehawkHotelId: a.ratehawkHotelId,
            maxPriceUsd: a.ratehawkMaxPriceUsd,
          })),
        }),
      });
      const data = await res.json();
      setAvailability(data.results ?? {});
      setAvailSource(data.source ?? "manual");
    } catch {
      toast.error(c.availabilityError);
    } finally {
      setCheckingAvail(false);
    }
  }, [checkIn, checkOut, activeAccommodations, passengers, c.availabilityError]);

  useEffect(() => {
    if (checkIn && checkOut && checkOut > checkIn) {
      const timer = setTimeout(checkAvailability, 400);
      return () => clearTimeout(timer);
    }
  }, [checkIn, checkOut, passengers.adults, passengers.children, checkAvailability]);

  useEffect(() => {
    if (!open || !tour) return;
    const tourId = tour.tourId;
    const preselectedIds = [...(tour.preselectedOptionalTours ?? [])];
    let cancelled = false;

    fetch(`/api/tours/${encodeURIComponent(tourId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const cfg =
          data.tour?.optionalTours ?? { pickCount: 0, options: [], additionalActivities: [] };
        setOptionalConfig(cfg);
        const preselected = preselectedIds.filter((id) =>
          (cfg.options ?? []).some((o: { id: string; name?: string }) => o.id === id && o.name?.trim()),
        );
        const pickCount = Number(cfg.pickCount) || 0;
        setSelectedIncludedTours(
          pickCount > 0 ? preselected.slice(0, pickCount) : preselected,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setOptionalConfig({ pickCount: 0, options: [], additionalActivities: [] });
        setSelectedIncludedTours([]);
      });

    return () => {
      cancelled = true;
    };
    // Sync al abrir / cambiar paquete; preselected se captura en ese momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tour?.tourId]);

  useEffect(() => {
    if (availableAccommodations.length && !availableAccommodations.find((a) => a.id === accommodationId)) {
      setAccommodationId(availableAccommodations[0].id);
    }
  }, [availableAccommodations, accommodationId]);

  useEffect(() => {
    if (roomOptions.length && !roomOptions.find((r) => r.id === roomTypeId)) {
      setRoomTypeId(roomOptions[0].id);
    }
  }, [roomOptions, roomTypeId]);

  useEffect(() => {
    if (!open || !tour?.tourId) return;
    const duration = tour.duration;
    if (duration) {
      setDurationRaw(duration);
      return;
    }
    let cancelled = false;
    fetch(`/api/tours/${encodeURIComponent(tour.tourId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDurationRaw(data.tour?.duration ?? "");
      })
      .catch(() => {
        if (!cancelled) setDurationRaw("");
      });
    return () => {
      cancelled = true;
    };
  }, [open, tour?.tourId, tour?.duration]);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setPassengers(isGroupTrip
        ? { adults: 1, children: 0, infants: 0, seniors: 0 }
        : { adults: 2, children: 0, infants: 0, seniors: 0 });
      setCheckIn("");
      setAccommodationId("");
      setFlightContactAccepted(false);
      setAvailability({});
      setAvailSource(null);
      setTravelers([]);
      setContactEmail(rouletteTourGift?.email ?? "");
      setContactPhoneLocal("");
      setContactPhoneCountry(DEFAULT_PHONE_COUNTRY);
      setRouletteGiftTourId("");
      setSelectedIncludedTours(tour?.preselectedOptionalTours ?? []);
      setSelectedExtras([]);
      setSelectedTourAddons({});
      setExtrasForAllPassengers(true);
      setExtraPassengerCounts({});
      // No vaciar optionalConfig aquí: el fetch de arriba carga los tours del admin.
      // Vaciar hacía que el paso «Tours» desapareciera o quedara vacío.
    }
  }, [open, tour?.tourId, tour?.preselectedOptionalTours, isGroupTrip, rouletteTourGift?.email]);

  useEffect(() => {
    setExtraPassengerCounts((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [id, count] of Object.entries(next)) {
        const clamped = Math.min(total, Math.max(1, count));
        if (clamped !== count) {
          next[id] = clamped;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [total]);

  useEffect(() => {
    if (currentStep === "checkout") {
      setTravelers(Array.from({ length: total }, () => emptyTraveler()));
    }
  }, [currentStep, total]);

  const adjust = (key: keyof PassengerCounts, delta: number) => {
    setPassengers((p) => {
      const next = Math.max(0, p[key] + delta);
      const updated = { ...p, [key]: next };
      if (totalPassengers(updated) === 0) return p;
      return updated;
    });
  };

  const validateDate = async (date: string) => {
    if (!date || !tour) {
      setCheckIn(date);
      return;
    }
    setValidatingDate(true);
    try {
      const res = await fetch(
        `/api/flights/allowed-dates?tourId=${encodeURIComponent(tour.tourId)}&month=${date.slice(0, 7)}&adults=${total}`,
      );
      const data = await res.json();
      if (data.hasBudget && Array.isArray(data.allowed) && data.allowed.length > 0 && !data.allowed.includes(date)) {
        toast.error(c.dateNotAllowed ?? "Esta fecha no está disponible");
        setCheckIn("");
        return;
      }
      setCheckIn(date);
    } catch {
      setCheckIn(date);
    } finally {
      setValidatingDate(false);
    }
  };

  const toggleIncludedTour = (id: string) => {
    const pickCount = optionalConfig.pickCount;
    setSelectedIncludedTours((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((x) => x !== id);
        setSelectedTourAddons((addons) => {
          const copy = { ...addons };
          delete copy[id];
          return copy;
        });
      } else if (pickCount > 0 && prev.length >= pickCount) {
        const removed = prev[0];
        next = [...prev.slice(1), id];
        setSelectedTourAddons((addons) => {
          const copy = { ...addons };
          delete copy[removed];
          return copy;
        });
      } else {
        next = [...prev, id];
      }
      if (!prev.includes(id)) {
        setSelectedExtras((extras) => extras.filter((x) => x !== id));
      }
      return next;
    });
  };

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) => {
      if (prev.includes(id)) {
        setSelectedTourAddons((addons) => {
          const copy = { ...addons };
          delete copy[id];
          return copy;
        });
        setExtraPassengerCounts((counts) => {
          const copy = { ...counts };
          delete copy[id];
          return copy;
        });
        return prev.filter((x) => x !== id);
      }
      setExtraPassengerCounts((counts) => ({ ...counts, [id]: total }));
      return [...prev, id];
    });
  };

  const adjustExtraPassengers = (extraId: string, delta: number) => {
    setExtraPassengerCounts((prev) => {
      const current = prev[extraId] ?? total;
      const next = Math.min(total, Math.max(1, current + delta));
      return { ...prev, [extraId]: next };
    });
  };

  const toggleTourAddon = (tourId: string, addonId: string) => {
    setSelectedTourAddons((prev) => {
      const current = prev[tourId] ?? [];
      const nextIds = current.includes(addonId)
        ? current.filter((x) => x !== addonId)
        : [...current, addonId];
      if (nextIds.length === 0) {
        const copy = { ...prev };
        delete copy[tourId];
        return copy;
      }
      return { ...prev, [tourId]: nextIds };
    });
  };

  const renderTourAddons = (
    opt: OptionalTourOption,
    isTourSelected: boolean,
    passengerCount = total,
  ) => {
    if (!isTourSelected || !visibleTourAddons(opt.addons).length) return null;
    const showPaxBreakdown =
      !extrasForAllPassengers && selectedExtras.includes(opt.id) && passengerCount !== total;
    return (
      <div className="mt-3 pt-3 border-t border-teal/20 space-y-2">
        {visibleTourAddons(opt.addons).map((addon) => {
          const checked = selectedTourAddons[opt.id]?.includes(addon.id) ?? false;
          const prompt = (c.tourAddonPrompt ?? "¿Deseas agregar {addon} a tu tour {tour}?")
            .replace("{addon}", addon.name)
            .replace("{tour}", opt.name);
          return (
            <label key={addon.id} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleTourAddon(opt.id, addon.id)}
                className="mt-0.5 accent-teal"
              />
              <span className="text-xs text-slate-600">
                {prompt}{" "}
                <strong className="text-slate-900">+{formatCLP(addon.price)}</strong>{" "}
                <span className="text-slate-400">{c.extrasPerPerson ?? "por persona"}</span>
                {showPaxBreakdown && (
                  <span className="text-slate-400">
                    {" "}({passengerCount} × {formatCLP(addon.price)} = {formatCLP(addon.price * passengerCount)})
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    );
  };

  const canContinuePassengers = total > 0 && (!showDates || !!checkIn);
  const canContinueFlights = flightContactAccepted;
  const canContinueAccommodation =
    !hasAccommodations || !!accommodationId || roomOptions.length > 0;
  const canContinueIncludedTours =
    selectedIncludedTours.length >= optionalConfig.pickCount &&
    (!rouletteTourGift || !!rouletteGiftTourId);

  const goNext = () => {
    if (currentStep === "passengers" && !canContinuePassengers) {
      if (showDates && !checkIn) toast.error(c.selectDates);
      return;
    }
    if (currentStep === "flights" && !canContinueFlights) {
      toast.error(c.flightContactAcceptRequired ?? "Debes aceptar para continuar");
      return;
    }
    if (currentStep === "accommodation" && !canContinueAccommodation) {
      toast.error(c.selectAccommodation);
      return;
    }
    if (currentStep === "includedTours" && !canContinueIncludedTours) {
      if (selectedIncludedTours.length < optionalConfig.pickCount) {
        toast.error(
          (c.pickToursRequired ?? "Debes elegir {count} tour(s) incluidos").replace(
            "{count}",
            String(optionalConfig.pickCount),
          ),
        );
        return;
      }
      toast.error("Elige tu tour adicional de regalo de la ruleta");
      return;
    }
    setStepIndex((i) => Math.min(flowSteps.length - 1, i + 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) setStepIndex(0);
    onOpenChange(next);
  };

  const handleAdd = () => {
    if (!tour || total <= 0) return;

    const email = contactEmail.trim();
    const phoneLocal = contactPhoneLocal.trim();
    const dial = getPhoneCountry(contactPhoneCountry).dial;
    const fullPhone = formatFullPhone(dial, phoneLocal);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(c.contactEmailRequired ?? "Ingresa un correo de contacto válido");
      return;
    }
    if (!phoneLocal || fullPhone.replace(/\D/g, "").length < 8) {
      toast.error(c.contactPhoneRequired ?? "Ingresa un teléfono de contacto válido");
      return;
    }

    for (let i = 0; i < travelers.length; i++) {
      const tr = travelers[i];
      if (!tr.fullName.trim() || !tr.documentId.trim()) {
        toast.error((c.travelerRequired ?? "Completa los datos del pasajero") + ` ${i + 1}`);
        return;
      }
    }

    const acc = activeAccommodations.find((a) => a.id === accommodationId);
    const room = roomOptions.find((r) => r.id === roomTypeId) ?? roomOptions[0];
    if (showDates && !flightContactAccepted) {
      toast.error(c.flightContactAcceptRequired ?? "Debes aceptar el contacto de vuelos para continuar");
      return;
    }

    const activeTourIds = new Set([...selectedIncludedTours, ...selectedExtras]);
    const tourAddonsForCart = Object.entries(selectedTourAddons)
      .filter(([tourId]) => activeTourIds.has(tourId))
      .flatMap(([tourId, addonIds]) => {
        const tourOpt = findOptionalTourById(optionalConfig, tourId);
        if (!tourOpt?.addons?.length) return [];
        return addonIds.flatMap((addonId) => {
          const addon = tourOpt.addons!.find((a) => a.id === addonId);
          if (!addon) return [];
          const pax = selectedExtras.includes(tourId) ? getExtraTourPassengers(tourId) : total;
          return [{
            tourId,
            tourName: tourOpt.name,
            addonId: addon.id,
            addonName: addon.name,
            pricePerPerson: addon.price,
            passengers: pax,
          }];
        });
      });

    const extraActivityPassengers = extrasForAllPassengers
      ? undefined
      : selectedExtras.map((id) => {
          const act = extrasCatalog.find((a) => a.id === id);
          return {
            activityId: id,
            activityName: act?.name ?? id,
            passengers: getExtraTourPassengers(id),
          };
        });

    const giftTour = rouletteGiftTourId
      ? optionalConfig.options.find((o) => o.id === rouletteGiftTourId)
      : undefined;

    addItem({
      tourId: tour.tourId,
      tourName: tour.tourName,
      image: tour.image,
      passengers,
      accommodationId: acc?.id,
      accommodationName: acc?.name,
      accommodationSurchargePerPerson:
        selectedAvailability?.surchargePerPerson && selectedAvailability.surchargePerPerson > 0
          ? selectedAvailability.surchargePerPerson
          : undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      roomTypeId: room?.id ?? "default",
      roomLabel: acc?.name ?? (room ? getRoomLabel(room, language) : ""),
      totalPrice,
      flightId: "pending-contact",
      flightLabel:
        c.flightContactCartLabel ??
        "El equipo enviará opciones de aerolínea y horarios dentro de 24 horas",
      travelers,
      contact: {
        email,
        phone: fullPhone,
        phoneCountry: contactPhoneCountry,
      },
      selectedOptionalTours: selectedIncludedTours.length ? selectedIncludedTours : undefined,
      selectedAdditionalActivities: selectedExtras.length ? selectedExtras : undefined,
      extrasForAllPassengers: selectedExtras.length ? extrasForAllPassengers : undefined,
      extraActivityPassengers,
      selectedTourAddons: tourAddonsForCart.length ? tourAddonsForCart : undefined,
      rouletteGiftTourId: giftTour?.id,
      rouletteGiftTourName: giftTour?.name,
    });
    trackAddToCart({
      item_id: tour.tourId,
      item_name: tour.tourName,
      price: totalPrice,
    });
    toast.success(c.added);
    announce(`${tour.tourName} ${c.added}`);
    onAdded();
  };

  const counters: { key: keyof PassengerCounts; label: string; hint: string }[] = [
    { key: "adults", label: c.adults, hint: c.adultsHint },
    { key: "children", label: c.children, hint: c.childrenHint },
    { key: "infants", label: c.infants, hint: c.infantsHint },
    { key: "seniors", label: c.seniors, hint: c.seniorsHint },
  ];

  const renderAccommodation = (acc: Accommodation) => {
    const provider = resolveAvailabilityProvider(acc);
    const status = provider !== "manual" ? availability[acc.id] : undefined;
    const isAvail = provider === "manual" || status?.available !== false;
    const price = calculateTourTotal(config, passengers, acc.id);
    const perPerson = getEffectivePassengerPrices(config, passengers, acc.id).adult;
    const surchargePerPerson = status?.surchargePerPerson ?? 0;
    const displayTotal = price + surchargePerPerson * payingPassengers(passengers);
    return (
      <div
        key={acc.id}
        className={`flex items-stretch gap-3 rounded-xl border p-3 transition-colors ${
          !isAvail ? "opacity-40 border-slate-100" : accommodationId === acc.id ? "border-teal bg-teal/5" : "border-slate-200 hover:bg-slate-50"
        }`}
      >
        {acc.image ? (
          <div className="relative h-16 w-16 sm:h-[4.5rem] sm:w-24 shrink-0 rounded-lg overflow-hidden bg-slate-100">
            <Image src={acc.image} alt={acc.name} fill className="object-cover" sizes="96px" />
          </div>
        ) : null}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <RadioGroupItem value={acc.id} id={acc.id} disabled={!isAvail} className="shrink-0" />
          <Label htmlFor={acc.id} className="flex-1 cursor-pointer min-w-0">
            <span className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
              {acc.name}
              <HotelStars stars={acc.stars} />
            </span>
            <span className="text-black text-sm font-bold">
              {formatCLP(perPerson)} / persona · {formatCLP(displayTotal)} total
              {surchargePerPerson > 0 && (
                <span className="text-amber-700 font-normal text-xs ml-1">
                  (+{formatCLP(surchargePerPerson)}/pax hotel)
                </span>
              )}
            </span>
            {acc.includesBreakfast === false && (
              <span className="text-amber-700 text-xs block mt-0.5">{c.withoutBreakfast}</span>
            )}
            {status?.available && checkIn && surchargePerPerson <= 0 && (
              <span className="text-green-600 text-xs flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" /> {c.available}
              </span>
            )}
            {status?.available && checkIn && surchargePerPerson > 0 && (
              <span className="text-amber-700 text-xs flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" />{" "}
                {(c.availableWithSurcharge ?? "Disponible con recargo de {amount}/persona").replace(
                  "{amount}",
                  formatCLP(surchargePerPerson),
                )}
              </span>
            )}
            {status?.available === false && (
              <span className="text-red-500 text-xs flex items-center gap-1 mt-0.5">
                <XCircle className="h-3 w-3" /> {c.notAvailable}
              </span>
            )}
          </Label>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        {tour && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{c.title}</DialogTitle>
              <DialogDescription>{tour.tourName}</DialogDescription>
            </DialogHeader>

            <CartStepIndicator steps={steps} current={stepIndex + 1} />

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0">
                <Image src={tour.image} alt={tour.tourName} fill className="object-cover" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{tour.tourName}</p>
                <p className="text-sm text-slate-500">
                  {c.desde} <span className="text-black font-bold">{formatCLP(displayPrice)}</span> {c.porPersona}
                </p>
              </div>
            </div>

            {currentStep === "passengers" && (
              <>
                {showDates && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-teal" />
                      <span className="font-semibold text-slate-900">{c.dates}</span>
                    </div>
                    <TourDatePicker
                      active={currentStep === "passengers"}
                      tourId={tour.tourId}
                      value={checkIn}
                      onChange={(date) => void validateDate(date)}
                      adults={total}
                      validating={validatingDate}
                      label={c.checkIn}
                      placeholder={c.selectDates ?? "Selecciona la fecha de ida"}
                      allowedDatesHint={c.allowedDatesHint ?? "Fechas disponibles según presupuesto de vuelo"}
                    />
                    {checkIn && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">
                        {c.returnAuto
                          .replace("{date}", formatTourDateEs(checkOut))
                          .replace("{duration}", parsedDuration.label)}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-teal" />
                    <span className="font-semibold text-slate-900">{c.passengers}</span>
                  </div>
                  <div className="space-y-3">
                    {counters.map(({ key, label, hint }) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm text-slate-900">{label}</p>
                          <p className="text-xs text-slate-400">{hint}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => adjust(key, -1)}
                            className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30"
                            disabled={passengers[key] <= 0}>
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{passengers[key]}</span>
                          <button type="button" onClick={() => adjust(key, 1)}
                            className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === "flights" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-teal" />
                  <span className="font-semibold text-slate-900">{c.stepFlights ?? "Vuelos"}</span>
                </div>
                <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-3">
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {(c.flightContactNotice ??
                      "Dentro de las próximas 24 horas, el equipo de Universo Nómada te contactará para entregarte las opciones de aerolíneas y horarios disponibles en la fecha indicada.")
                      .replace(
                        "{date}",
                        checkIn ? formatTourDateEs(checkIn) : (c.selectDates ?? "la fecha elegida"),
                      )}
                  </p>
                  {checkIn ? (
                    <p className="text-xs text-slate-600 bg-white/70 rounded-lg px-3 py-2 border border-slate-200">
                      {(c.flightContactDateLabel ?? "Fecha de ida seleccionada")}:{" "}
                      <span className="font-semibold text-slate-900">{formatTourDateEs(checkIn)}</span>
                      {checkOut ? (
                        <>
                          {" · "}
                          {(c.flightContactReturnLabel ?? "Regreso")}:{" "}
                          <span className="font-semibold text-slate-900">{formatTourDateEs(checkOut)}</span>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={flightContactAccepted}
                      onChange={(e) => setFlightContactAccepted(e.target.checked)}
                      className="mt-1 rounded border-slate-300 text-teal focus:ring-teal"
                    />
                    <span className="text-sm text-slate-800 font-medium leading-snug">
                      {c.flightContactAccept ??
                        "Acepto que el equipo me contacte dentro de 24 horas con las opciones de aerolínea y horarios para esta fecha."}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {currentStep === "accommodation" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-teal" />
                  <span className="font-semibold text-slate-900">{c.accommodation}</span>
                </div>
                <div className="mb-3">
                  <AvailabilityDisclaimer variant="compact" />
                </div>

                {hasAccommodations && (
                  <>
                    {!checkIn && showDates ? (
                      <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-3">{c.selectDatesFirst}</p>
                    ) : availableAccommodations.length === 0 ? (
                      <p className="text-sm text-red-500 bg-red-50 rounded-xl p-3">{c.noAccommodationAvailable}</p>
                    ) : (
                      <>
                        {checkingAvail && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> {c.checkingAvailability}
                          </p>
                        )}
                        <RadioGroup value={accommodationId} onValueChange={setAccommodationId} className="space-y-2">
                          {availableAccommodations.map(renderAccommodation)}
                        </RadioGroup>
                      </>
                    )}
                  </>
                )}

                {!hasAccommodations && roomOptions.length > 0 && (
                  <RadioGroup value={roomTypeId} onValueChange={setRoomTypeId} className="space-y-2">
                    {roomOptions.map((opt) => (
                      <div key={opt.id} className="flex items-center space-x-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <Label htmlFor={opt.id} className="flex-1 cursor-pointer text-sm font-medium">
                          {getRoomLabel(opt, language)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            )}

            {currentStep === "includedTours" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-teal" />
                  <span className="font-semibold text-slate-900">{c.stepIncludedTours ?? "Tours incluidos"}</span>
                </div>

                {bundledIncludedTours.length > 0 && (
                  <BundledIncludedToursBanner
                    tours={bundledIncludedTours}
                    title={c.bundledToursTitle ?? "Tours incluidos:"}
                  />
                )}

                <p className="text-sm text-teal font-medium mb-1">
                  {(c.pickToursHint ?? "Elige {count} tour(s) incluidos en tu paquete").replace(
                    "{count}",
                    String(optionalConfig.pickCount),
                  )}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  {(c.pickToursProgress ?? "{selected} de {count} seleccionados")
                    .replace("{selected}", String(selectedIncludedTours.length))
                    .replace("{count}", String(optionalConfig.pickCount))}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {optionalConfig.options.map((opt) => {
                    const selected = selectedIncludedTours.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          selected ? "border-teal bg-teal/5" : "border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleIncludedTour(opt.id)}
                          className="w-full text-left hover:opacity-90"
                        >
                          <div className="flex gap-3">
                            {opt.image && (
                              <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0">
                                <Image src={opt.image} alt={opt.name} fill className="object-cover" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-sm text-slate-900">{opt.name}</p>
                              {opt.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                              )}
                            </div>
                          </div>
                        </button>
                        {renderTourAddons(opt, selected)}
                      </div>
                    );
                  })}
                </div>

                {rouletteTourGift && (
                  <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-amber-700" />
                      <span className="font-bold text-amber-900 text-sm">
                        Tour adicional de regalo — ¡elige el tuyo!
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 mb-3">
                      Ganaste un tour extra sin costo en la ruleta. Selecciona cuál quieres de regalo:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {optionalConfig.options.map((opt) => {
                        const selected = rouletteGiftTourId === opt.id;
                        return (
                          <button
                            key={`gift-${opt.id}`}
                            type="button"
                            onClick={() => setRouletteGiftTourId(opt.id)}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              selected ? "border-amber-500 bg-white ring-2 ring-amber-400" : "border-amber-200 bg-white/80 hover:bg-white"
                            }`}
                          >
                            <p className="font-semibold text-sm text-slate-900">{opt.name}</p>
                            {opt.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === "extras" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="h-4 w-4 text-teal" />
                  <span className="font-semibold text-slate-900">{c.additionalActivities ?? "Actividades adicionales"}</span>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  {c.additionalActivitiesHint ?? "¿Deseas agregar alguna actividad extra a tu compra? (opcional)"}
                </p>
                <button
                  type="button"
                  onClick={() => setExtrasForAllPassengers((v) => !v)}
                  className={`w-full mb-4 rounded-xl border p-3 flex items-center gap-3 transition-colors text-left ${
                    extrasForAllPassengers
                      ? "border-teal bg-teal/10 ring-1 ring-teal/30"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded border shrink-0 flex items-center justify-center ${
                      extrasForAllPassengers
                        ? "bg-teal border-teal text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {extrasForAllPassengers && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {c.extrasAllPassengers ?? "Incluir los tours a todos los pasajeros"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.extrasAllPassengersHint ??
                        "Desmarca para elegir cuántos pasajeros van a cada tour adicional"}
                    </p>
                  </div>
                </button>
                <div className="grid grid-cols-1 gap-3">
                  {extrasCatalog.map((act) => {
                    const selected = selectedExtras.includes(act.id);
                    const extraPax = getExtraTourPassengers(act.id);
                    const lineTotal = calculateOptionalTourExtraPrice(act, extraPax);
                    const priceInfo = getOptionalTourExtraPerPersonLabel(act, extraPax);
                    return (
                      <div
                        key={act.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          selected ? "border-teal bg-teal/5" : "border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleExtra(act.id)}
                          className="w-full text-left hover:opacity-90"
                        >
                          <div className="flex gap-3 items-center">
                            {act.image && (
                              <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0">
                                <Image src={act.image} alt={act.name} fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-900">{act.name}</p>
                              {act.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                              )}
                            </div>
                            <span className="text-sm font-bold text-slate-900 shrink-0">
                              {formatCLP(selected ? lineTotal : priceInfo.amount)}
                              <span className="text-xs font-normal text-slate-400 block">
                                {selected
                                  ? act.priceVariesByPax
                                    ? `${extraPax} × ${formatCLP(priceInfo.amount)}`
                                    : priceInfo.label
                                  : act.priceVariesByPax
                                    ? (c.extrasPerPerson ?? "por persona")
                                    : (c.extrasFlatPrice ?? "precio fijo")}
                              </span>
                            </span>
                          </div>
                        </button>
                        {!extrasForAllPassengers && selected && (
                          <div
                            className="mt-3 pt-3 border-t border-teal/20 flex items-center justify-between gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-slate-600">
                              {c.extrasPassengersForTour ?? "Pasajeros para este tour"}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-lg"
                                disabled={extraPax <= 1}
                                onClick={() => adjustExtraPassengers(act.id, -1)}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className="w-8 text-center text-sm font-bold text-slate-900">
                                {extraPax}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-lg"
                                disabled={extraPax >= total}
                                onClick={() => adjustExtraPassengers(act.id, 1)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {renderTourAddons(act, selected, extraPax)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === "checkout" && (
              <div className="space-y-4">
                <AvailabilityDisclaimer variant="full" />
                <div className="border border-teal/30 bg-teal/5 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-slate-900">{c.contactData ?? "Datos de contacto"}</p>
                  <p className="text-xs text-slate-500">{c.contactDataHint ?? "Un solo correo y teléfono para toda la reserva"}</p>
                  <Input
                    placeholder={c.email ?? "Correo electrónico"}
                    value={contactEmail}
                    type="email"
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="rounded-xl"
                  />
                  <PhoneInput
                    label={c.phone ?? "Teléfono"}
                    countryIso={contactPhoneCountry}
                    onCountryChange={setContactPhoneCountry}
                    value={contactPhoneLocal}
                    onChange={setContactPhoneLocal}
                    placeholder="9 1234 5678"
                  />
                </div>

                <p className="font-semibold text-slate-900">{c.travelerData ?? "Datos de los pasajeros"}</p>
                {travelers.map((tr, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-bold text-teal">{c.traveler ?? "Pasajero"} {i + 1}</p>
                    <Input placeholder={c.fullName ?? "Nombre completo"} value={tr.fullName}
                      onChange={(e) => setTravelers((prev) => prev.map((x, j) => j === i ? { ...x, fullName: e.target.value } : x))}
                      className="rounded-xl" />
                    <Input placeholder={c.documentId ?? "RUT / Pasaporte"} value={tr.documentId}
                      onChange={(e) => setTravelers((prev) => prev.map((x, j) => j === i ? { ...x, documentId: e.target.value } : x))}
                      className="rounded-xl" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <SteppedDatePicker
                        active={currentStep === "checkout"}
                        label={c.birthDate ?? "Fecha de nacimiento"}
                        placeholder={c.selectBirthDate ?? "Selecciona fecha de nacimiento"}
                        value={tr.birthDate}
                        onChange={(iso) => setTravelers((prev) => prev.map((x, j) => j === i ? { ...x, birthDate: iso } : x))}
                        maxDate={new Date()}
                        minYear={new Date().getFullYear() - 100}
                        maxYear={new Date().getFullYear()}
                      />
                      <SteppedDatePicker
                        active={currentStep === "checkout"}
                        label={c.documentExpiry ?? "Vencimiento documento"}
                        placeholder={c.selectDocExpiry ?? "Selecciona vencimiento"}
                        value={tr.documentExpiry}
                        onChange={(iso) => setTravelers((prev) => prev.map((x, j) => j === i ? { ...x, documentExpiry: iso } : x))}
                        minDate={new Date()}
                        minYear={new Date().getFullYear()}
                        maxYear={new Date().getFullYear() + 20}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 space-y-1">
              <div className="flex justify-between text-sm text-slate-600">
                <span>{c.totalPassengers}: {total}</span>
                <div className="text-right space-y-0.5">
                  {extrasPrice > 0 && <div>{c.extrasTotal ?? "Extras"}: {formatCLP(extrasPrice)}</div>}
                  {addonsPrice > 0 && <div>{c.tourAddonsTotal ?? "Complementos"}: {formatCLP(addonsPrice)}</div>}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-teal/20">
                <span className="font-bold text-slate-900">{c.total}</span>
                <span className="text-2xl font-black text-black">{formatCLP(totalPrice)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {stepIndex > 0 && (
                <Button type="button" variant="outline" onClick={goBack} className="rounded-xl">
                  <ChevronLeft className="h-4 w-4 mr-1" /> {c.back ?? "Atrás"}
                </Button>
              )}
              {currentStep !== "checkout" ? (
                <Button type="button" onClick={goNext} className="flex-1 bg-teal text-white rounded-xl h-12">
                  {c.continue ?? "Continuar"} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleAdd} className="flex-1 bg-gradient-to-r from-amber to-orange-500 hover:from-amber-dark hover:to-orange-600 text-white font-bold rounded-xl h-12">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {c.addToCart}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
