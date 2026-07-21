"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion } from "framer-motion";

type Props = {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: "div" | "button" | "a";
  onClick?: () => void;
  href?: string;
};

export function MagneticHover({
  children,
  className = "",
  strength = 0.35,
  as = "div",
  onClick,
  href,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - cx) * strength,
      y: (e.clientY - cy) * strength,
    });
  };

  const reset = () => setOffset({ x: 0, y: 0 });

  const inner =
    as === "a" && href ? (
      <a href={href} className="block w-full">
        {children}
      </a>
    ) : as === "button" ? (
      <button type="button" onClick={onClick} className="block w-full">
        {children}
      </button>
    ) : (
      children
    );

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.4 }}
      className={`magnetic-hover ${className}`}
      onClick={as === "div" ? onClick : undefined}
    >
      {inner}
    </motion.div>
  );
}
