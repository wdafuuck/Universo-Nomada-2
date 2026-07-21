export type RoomOption = {
  id: string;
  label: { es: string; en: string; fr: string; zh: string };
};

export function getRoomOptions(totalPassengers: number): RoomOption[] {
  if (totalPassengers <= 0) return [];
  if (totalPassengers === 1) {
    return [{ id: "single", label: { es: "Habitación Single", en: "Single room", fr: "Chambre single", zh: "单人间" } }];
  }
  if (totalPassengers === 2) {
    return [
      { id: "double", label: { es: "Cama doble", en: "Double bed", fr: "Lit double", zh: "双人床" } },
      { id: "twin", label: { es: "Camas twin (2 camas)", en: "Twin beds", fr: "Lits jumeaux", zh: "双床" } },
    ];
  }
  if (totalPassengers === 3) {
    return [
      { id: "triple", label: { es: "Habitación triple", en: "Triple room", fr: "Chambre triple", zh: "三人间" } },
      { id: "single-double", label: { es: "1 Single + 1 Doble", en: "1 Single + 1 Double", fr: "1 Single + 1 Double", zh: "1单人间 + 1双人间" } },
    ];
  }
  if (totalPassengers === 4) {
    return [
      { id: "double-double", label: { es: "2 Habitaciones dobles", en: "2 Double rooms", fr: "2 chambres doubles", zh: "2间双人间" } },
      { id: "triple-single", label: { es: "Triple + Single", en: "Triple + Single", fr: "Triple + Single", zh: "三人间 + 单人间" } },
    ];
  }
  return [
    {
      id: "multi",
      label: {
        es: `Configuración para ${totalPassengers} personas (coordinación al checkout)`,
        en: `Setup for ${totalPassengers} guests (confirmed at checkout)`,
        fr: `Configuration pour ${totalPassengers} personnes`,
        zh: `${totalPassengers}人住宿配置（结账时确认）`,
      },
    },
  ];
}

import type { Language } from "@/lib/translations";

export function getRoomLabel(option: RoomOption, lang: Language) {
  const key = lang in option.label ? (lang as keyof RoomOption["label"]) : "es";
  return option.label[key] ?? option.label.es;
}
