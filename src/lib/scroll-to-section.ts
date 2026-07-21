/** Desplaza suavemente a una sección por id (p. ej. destinos al volver desde un paquete). */
export function scrollToSection(sectionId: string, behavior: ScrollBehavior = "smooth") {
  if (typeof document === "undefined") return;
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior, block: "start" });
}

export function scrollToHashFromLocation(delayMs = 120) {
  if (typeof window === "undefined") return;
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return;
  window.setTimeout(() => scrollToSection(id), delayMs);
}
