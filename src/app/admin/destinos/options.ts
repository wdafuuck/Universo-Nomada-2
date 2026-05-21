export const CATEGORY_OPTIONS = [
  { value: "chile", label: "Chile" },
  { value: "internacional", label: "Internacional" },
  { value: "experiencial", label: "Experiencial" },
];

export const TAG_COLOR_OPTIONS = [
  { value: "bg-violet-500/20 text-violet-300", label: "Violeta", swatch: "bg-violet-500" },
  { value: "bg-amber-500/20 text-amber-300", label: "Ámbar", swatch: "bg-amber-500" },
  { value: "bg-emerald-500/20 text-emerald-300", label: "Esmeralda", swatch: "bg-emerald-500" },
  { value: "bg-orange-500/20 text-orange-300", label: "Naranja", swatch: "bg-orange-500" },
  { value: "bg-cyan-500/20 text-cyan-300", label: "Cyan", swatch: "bg-cyan-500" },
  { value: "bg-rose-500/20 text-rose-300", label: "Rosa", swatch: "bg-rose-500" },
  { value: "bg-green-500/20 text-green-300", label: "Verde", swatch: "bg-green-500" },
  { value: "bg-yellow-500/20 text-yellow-300", label: "Amarillo", swatch: "bg-yellow-500" },
  { value: "bg-sky-500/20 text-sky-300", label: "Cielo", swatch: "bg-sky-500" },
  { value: "bg-teal-500/20 text-teal-300", label: "Teal", swatch: "bg-teal-500" },
  { value: "bg-purple-500/20 text-purple-300", label: "Púrpura", swatch: "bg-purple-500" },
];

export const ICON_OPTIONS = [
  "Compass",
  "Mountain",
  "Binoculars",
  "Heart",
  "Waves",
  "Palmtree",
  "TreePine",
  "Star",
  "MapPin",
  "Plane",
  "Globe",
  "Camera",
  "Sparkles",
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
