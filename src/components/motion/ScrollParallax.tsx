"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Intensidad del drift vertical (px aprox.) */
  strength?: number;
  /** Dirección: 1 = se mueve con el scroll, -1 = contrario (parallax) */
  direction?: 1 | -1;
};

/** Parallax suave al scrollear la sección — sensación de profundidad / flow */
export function ScrollParallax({
  children,
  className = "",
  strength = 48,
  direction = -1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rawY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [strength * direction, 0, -strength * direction],
  );
  const y = useSpring(rawY, { stiffness: 60, damping: 22, mass: 0.8 });
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.55, 1, 1, 0.55]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, opacity }}>{children}</motion.div>
    </div>
  );
}
