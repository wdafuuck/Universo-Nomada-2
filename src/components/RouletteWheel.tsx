"use client";

import { useEffect, useRef, useState } from "react";
import { ROULETTE_SEGMENTS } from "@/lib/roulette-shared";

type Props = {
  segmentIndex: number;
  spinning: boolean;
  onSpinEnd?: () => void;
  size?: number;
};

const N = ROULETTE_SEGMENTS.length;
const SEG = 360 / N;
const SPIN_MS = 4000;

function spinToDeg(segmentIndex: number, from: number): number {
  const center = segmentIndex * SEG + SEG / 2;
  const align = 90 - center;
  const base = Math.ceil(from / 360) * 360;
  let target = base + 360 * 5 + ((align % 360) + 360) % 360;
  if (target - from < 360 * 4) target += 360;
  return target;
}

/** Ruleta SVG: texto radial (centro → afuera) + CSS rotate. */
export function RouletteWheel({
  segmentIndex,
  spinning,
  onSpinEnd,
  size = 280,
}: Props) {
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const fromRef = useRef(0);
  const endedRef = useRef(false);
  const onEndRef = useRef(onSpinEnd);
  onEndRef.current = onSpinEnd;
  const r = size / 2;
  const fontSize = Math.max(8, Math.round(size / 32));
  const lineGap = fontSize * 0.95;

  useEffect(() => {
    if (!spinning || endedRef.current) return;
    endedRef.current = false;
    const from = fromRef.current;
    const to = spinToDeg(segmentIndex, from);
    fromRef.current = to;

    setAnimating(false);
    setRotation(from);
    const t0 = window.setTimeout(() => {
      setAnimating(true);
      setRotation(to);
    }, 30);

    const t1 = window.setTimeout(() => {
      setAnimating(false);
      endedRef.current = true;
      window.setTimeout(() => onEndRef.current?.(), 60);
    }, SPIN_MS + 60);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [spinning, segmentIndex]);

  useEffect(() => {
    if (!spinning) endedRef.current = false;
  }, [spinning]);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block overflow-visible"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: animating
            ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.15, 1)`
            : "none",
        }}
        aria-hidden
      >
        {ROULETTE_SEGMENTS.map((seg, i) => {
          const start = ((i * SEG - 90) * Math.PI) / 180;
          const end = (((i + 1) * SEG - 90) * Math.PI) / 180;
          const x1 = r + (r - 2) * Math.cos(start);
          const y1 = r + (r - 2) * Math.sin(start);
          const x2 = r + (r - 2) * Math.cos(end);
          const y2 = r + (r - 2) * Math.sin(end);
          // Ángulo del centro del segmento (grados); texto sale del centro hacia afuera
          const midDeg = (i + 0.5) * SEG - 90;
          const lines = seg.wheelLines;

          return (
            <g key={i}>
              <path
                d={`M ${r} ${r} L ${x1} ${y1} A ${r - 2} ${r - 2} 0 0 1 ${x2} ${y2} Z`}
                fill={seg.color}
                stroke="#fff"
                strokeWidth="2"
              />
              <g transform={`translate(${r}, ${r}) rotate(${midDeg})`}>
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={r * 0.52}
                    y={
                      lines.length === 1
                        ? 0
                        : li === 0
                          ? -lineGap * 0.45
                          : lineGap * 0.45
                    }
                    fill="#fff"
                    fontSize={fontSize}
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {line}
                  </text>
                ))}
              </g>
            </g>
          );
        })}
        <circle cx={r} cy={r} r={r * 0.05} fill="#fff" />
      </svg>
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          right: -2,
          borderTop: "12px solid transparent",
          borderBottom: "12px solid transparent",
          borderLeft: "20px solid #fff",
        }}
      />
    </div>
  );
}
