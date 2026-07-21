"use client";

import { useEffect } from "react";

/** Scroll suave + clase global + dirección de scroll para transiciones */
export function PageAmbient() {
  useEffect(() => {
    document.documentElement.classList.add("premium-motion");
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      document.documentElement.classList.add("reduce-motion");
    }
    const onMotionPref = () => {
      document.documentElement.classList.toggle("reduce-motion", mq.matches);
    };
    mq.addEventListener("change", onMotionPref);

    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dir = y > lastY + 2 ? "down" : y < lastY - 2 ? "up" : null;
        if (dir) {
          document.documentElement.dataset.scrollDir = dir;
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.documentElement.classList.remove("premium-motion");
      document.documentElement.removeAttribute("data-scroll-dir");
      mq.removeEventListener("change", onMotionPref);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div aria-hidden className="page-ambient fixed inset-0 pointer-events-none z-0">
      <div className="page-ambient-glow page-ambient-glow-1" />
      <div className="page-ambient-glow page-ambient-glow-2" />
      <div className="page-ambient-glow page-ambient-glow-3" />
    </div>
  );
}
