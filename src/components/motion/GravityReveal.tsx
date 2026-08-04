"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Mode = "drop" | "up" | "flow" | "flowLeft" | "anti";

type Props = {
  children: React.ReactNode;
  delay?: number;
  mode?: Mode;
  className?: string;
  once?: boolean;
  float?: boolean;
};

/**
 * Wrapper de presencia. En móvil / reduced-motion: sin framer.
 * En desktop: no usa opacity:0 al montar (evita home con bandas vacías).
 */
export function GravityReveal({
  children,
  className = "",
  float = false,
}: Props) {
  const [lite, setLite] = useState(true);

  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 768px)");
    const sync = () => setLite(mqMotion.matches || mqMobile.matches);
    sync();
    mqMotion.addEventListener("change", sync);
    mqMobile.addEventListener("change", sync);
    return () => {
      mqMotion.removeEventListener("change", sync);
      mqMobile.removeEventListener("change", sync);
    };
  }, []);

  if (lite) {
    return <div className={className}>{children}</div>;
  }

  if (!float) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0, 4, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
