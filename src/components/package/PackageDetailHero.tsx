"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { FlowField } from "@/components/motion/FlowField";
import { gravityDrop } from "@/lib/motion-presets";

type Props = {
  name: string;
  subtitle: string;
  image: string;
  duration?: string;
};

export function PackageDetailHero({ name, subtitle, image, duration }: Props) {
  return (
    <div className="relative min-h-[52vh] sm:min-h-[58vh] overflow-hidden bg-slate-950">
      <FlowField variant="aurora" className="opacity-25" intensity="subtle" />
      <Image
        src={image}
        alt={name}
        fill
        priority
        sizes="100vw"
        quality={90}
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/45 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/40 via-transparent to-teal/15" />

      <Link
        href="/#destinos"
        className="absolute top-4 left-4 z-20 bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/20 transition-colors border border-white/15"
        aria-label="Volver a todos los paquetes"
      >
        <ArrowLeft className="h-6 w-6" />
      </Link>

      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <motion.div
            variants={gravityDrop}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            {duration && (
              <span className="inline-block mb-3 text-xs font-bold uppercase tracking-widest text-teal-300 bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/15">
                {duration}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
              {name}
            </h1>
            <p className="text-lg sm:text-xl text-white/85 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-300 shrink-0" />
              {subtitle}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
