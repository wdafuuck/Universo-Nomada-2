"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import {
  gravityDrop,
  revealUp,
  flowSlide,
  flowSlideLeft,
  antiGravityRise,
} from "@/lib/motion-presets";

type Mode = "drop" | "up" | "flow" | "flowLeft" | "anti";

const variantsMap: Record<Mode, Variants> = {
  drop: gravityDrop,
  up: revealUp,
  flow: flowSlide,
  flowLeft: flowSlideLeft,
  anti: antiGravityRise,
};

type Props = {
  children: React.ReactNode;
  delay?: number;
  mode?: Mode;
  className?: string;
  once?: boolean;
  float?: boolean;
};

/** En móvil / reduced-motion: sin framer (mejor TBT PageSpeed). */
export function GravityReveal({
  children,
  delay = 0,
  mode = "anti",
  className = "",
  once = true,
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

  const ref = useRef(null);
  const inView = useInView(ref, {
    once,
    margin: "-8% 0px -8% 0px",
    amount: 0.15,
  });

  if (lite) {
    return <div className={className}>{children}</div>;
  }

  const enter = variantsMap[mode];
  const variants: Variants = once
    ? enter
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.45 } },
      };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay }}
      className={className}
      style={{
        perspective: mode === "flow" || mode === "flowLeft" ? 1200 : undefined,
      }}
    >
      {float ? (
        <motion.div
          animate={inView ? { y: [0, -6, 0, 4, 0] } : { y: 0 }}
          transition={
            inView
              ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.25 }
          }
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
}
