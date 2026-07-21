import type { Transition, Variants } from "framer-motion";

/** Spring con sensación de gravedad — caída suave con rebote */
export const gravitySpring: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 16,
  mass: 1,
};

export const gravityHeavy: Transition = {
  type: "spring",
  stiffness: 70,
  damping: 14,
  mass: 1.35,
};

/** Antigravity — sube con overshoot y flota un instante */
export const antiGravitySpring: Transition = {
  type: "spring",
  stiffness: 88,
  damping: 12,
  mass: 1.05,
};

export const flowEase: Transition = {
  duration: 1.05,
  ease: [0.16, 1, 0.3, 1],
};

export const luxuryEase = [0.22, 1, 0.36, 1] as const;

/** Contenedor con hijos en cascada */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

/** Caída desde arriba con gravedad */
export const gravityDrop: Variants = {
  hidden: { opacity: 0, y: -56, scale: 0.94, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: gravitySpring,
  },
};

/** Antigravity — emerge desde abajo y “flota” al lugar */
export const antiGravityRise: Variants = {
  hidden: { opacity: 0, y: 84, scale: 0.92, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: antiGravitySpring,
  },
};

/** Flujo lateral — entra deslizando con inercia */
export const flowSlide: Variants = {
  hidden: { opacity: 0, x: 72, rotateY: -10, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    filter: "blur(0px)",
    transition: flowEase,
  },
};

export const flowSlideLeft: Variants = {
  hidden: { opacity: 0, x: -72, rotateY: 10, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    filter: "blur(0px)",
    transition: flowEase,
  },
};

/** Revelación desde abajo (scroll) */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 88, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.95, ease: luxuryEase },
  },
};

/** Escala dramática para modales / CTAs */
export const scaleBloom: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: gravitySpring,
  },
  exit: { opacity: 0, scale: 0.92, y: 12, transition: { duration: 0.25 } },
};

/** Nav / header */
export const navDrop: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: luxuryEase },
  },
};
