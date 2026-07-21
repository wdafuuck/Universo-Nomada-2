"use client";

import { forwardRef, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FlowField } from "@/components/motion/FlowField";
import { antiGravityRise } from "@/lib/motion-presets";
import { WAVE_COLORS } from "@/components/WildlifeBackground";

type Props = {
  children: ReactNode;
};

/** Ola arriba (FAQ) y abajo (footer) — solo 2 colores en cada borde */
export const ContactSectionShell = forwardRef<HTMLElement, Props>(function ContactSectionShell(
  { children },
  ref,
) {
  return (
    <section
      ref={ref}
      id="contacto"
      className="relative overflow-hidden"
      style={{ backgroundColor: WAVE_COLORS.footer }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-14 sm:h-20 z-0"
        style={{ backgroundColor: WAVE_COLORS.slateSoft }}
      />

      <svg aria-hidden className="absolute w-0 h-0" focusable="false">
        <defs>
          <clipPath id="contact-wave-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0.04 C0.25,0.006 0.75,0.09 1,0.04 L1,0.96 C0.75,0.91 0.25,0.994 0,0.96 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="relative z-10 py-16 sm:py-24"
        style={{
          clipPath: "url(#contact-wave-clip)",
          WebkitClipPath: "url(#contact-wave-clip)",
          backgroundColor: WAVE_COLORS.contact,
        }}
      >
        <Image
          src="/images/familia-universo-nomada-v2.jpg"
          alt=""
          fill
          className="object-cover object-[center_30%] opacity-[0.12]"
          sizes="100vw"
          quality={80}
        />
        <FlowField variant="warm" className="opacity-40" intensity="medium" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: `${WAVE_COLORS.contact}cc` }}
        />

        <motion.div
          variants={antiGravityRise}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px", amount: 0.2 }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
});
