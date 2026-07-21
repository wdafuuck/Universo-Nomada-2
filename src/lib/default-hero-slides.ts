export const DEFAULT_HERO_SLIDES = [
  { imageUrl: "/images/florianopolis.png", label: "Florianópolis", sortOrder: 0 },
  { imageUrl: "/images/rapanui.png", label: "Rapa Nui", sortOrder: 1 },
  { imageUrl: "/images/atacama-new.png", label: "Atacama", sortOrder: 2 },
  { imageUrl: "/images/mendoza.png", label: "Mendoza", sortOrder: 3 },
  { imageUrl: "/images/cusco.png", label: "Cusco", sortOrder: 4 },
] as const;

export const FALLBACK_HERO_IMAGES = DEFAULT_HERO_SLIDES.map((s) => s.imageUrl);
