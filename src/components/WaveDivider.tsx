"use client";

export const WAVE_HEIGHT_CLASS = "h-16 sm:h-20 md:h-24";

/**
 * Ola única y suave. El contenedor lleva el color inferior; el path SVG
 * cubre la parte superior con el color de la sección de arriba.
 * Un solo trazo evita los artefactos al estirar en pantallas anchas.
 */
const WAVE_TOP =
  "M0,0 H1440 V32 C1080,78 360,6 0,32 V0 Z";

export type WaveProps = {
  fromColor: string;
  toColor: string;
  /** @deprecated Se usa una sola curva; el valor se ignora */
  variant?: number;
  className?: string;
};

export function WaveSeparator({ fromColor, toColor, className = "" }: WaveProps) {
  return (
    <div
      aria-hidden
      className={`relative block w-full shrink-0 ${WAVE_HEIGHT_CLASS} leading-none overflow-hidden ${className}`}
      style={{ backgroundColor: toColor }}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="wave-flow absolute inset-0 block h-full w-full"
      >
        <path fill={fromColor} d={WAVE_TOP} />
      </svg>
    </div>
  );
}

export const SectionWaveBottom = WaveSeparator;
