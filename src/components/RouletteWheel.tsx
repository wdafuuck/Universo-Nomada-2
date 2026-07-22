"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ROULETTE_SEGMENTS } from "@/lib/roulette-shared";

type Props = {
  segmentIndex: number;
  spinning: boolean;
  onSpinEnd?: () => void;
  size?: number;
  pointer?: "top" | "right";
  idle?: boolean;
  display?: "half" | "full";
};

const SEGMENT_ANGLE = 360 / ROULETTE_SEGMENTS.length;
const POINTER_ANGLE: Record<"top" | "right", number> = { top: 0, right: 90 };
const SPIN_MS = 4500;

const INNER_MARGIN_RATIO = 0.1;
const OUTER_MARGIN_RATIO = 0.06;
const LINE_OFFSET_FACTOR = 0.52;

function spinTargetRotation(segmentIndex: number, pointer: "top" | "right", from: number): number {
  const centerOffset = segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const pointerAngle = POINTER_ANGLE[pointer];
  let delta = pointerAngle - centerOffset;
  delta = ((delta % 360) + 360) % 360;
  const base = Math.ceil(from / 360) * 360;
  return base + 360 * 6 + delta;
}

function wedgeInner(r: number) {
  return r * INNER_MARGIN_RATIO;
}

function wedgeOuter(r: number) {
  return r * (1 - OUTER_MARGIN_RATIO);
}

function wedgeMid(r: number) {
  return (wedgeInner(r) + wedgeOuter(r)) / 2;
}

function wedgeWidthAt(r: number, dist: number): number {
  return 2 * dist * Math.sin((SEGMENT_ANGLE * Math.PI) / 360);
}

function textWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55;
}

function linesFit(lines: string[], fontSize: number, r: number): boolean {
  const midR = wedgeMid(r);
  const maxW = wedgeWidthAt(r, midR) * 0.9;
  const maxLineW = Math.max(...lines.map((line) => textWidth(line, fontSize)));
  if (maxLineW > maxW) return false;
  const halfRad = maxLineW / 2;
  return midR - halfRad >= wedgeInner(r) + 1 && midR + halfRad <= wedgeOuter(r) - 1;
}

function pickFontSize(diameter: number): number {
  const r = diameter / 2;
  const allLines = ROULETTE_SEGMENTS.map((s) => s.wheelLines);
  let best = Math.max(8, Math.round(diameter / 36));
  for (let ratio = 18; ratio <= 32; ratio++) {
    const fs = Math.max(8, Math.round(diameter / ratio));
    if (allLines.every((lines) => linesFit(lines, fs, r))) {
      best = fs;
    } else {
      break;
    }
  }
  return best;
}

function segmentPath(r: number, i: number): string {
  const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
  const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
  const x1 = r + r * Math.cos(startAngle);
  const y1 = r + r * Math.sin(startAngle);
  const x2 = r + r * Math.cos(endAngle);
  const y2 = r + r * Math.sin(endAngle);
  return `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

export function RouletteWheel({
  segmentIndex,
  spinning,
  onSpinEnd,
  size = 300,
  pointer = "right",
  idle = false,
  display = "full",
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const prevSpinning = useRef(false);
  const spinEndedRef = useRef(false);
  const rotationRef = useRef(0);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;

  const isHalf = display === "half";
  // Tamaño fijo: no redimensionar el SVG al pasar de half→full (evita crash GPU en Chrome)
  const wheelDiameter = Math.round(Math.max(size, 220) * 1.85);
  const clipWidth = isHalf ? Math.round(wheelDiameter / 2) : wheelDiameter;
  const r = wheelDiameter / 2;
  const fontSize = pickFontSize(wheelDiameter);
  const textDist = wedgeMid(r);
  const lineOffset = fontSize * LINE_OFFSET_FACTOR;
  const showIdle = idle && !spinning && !animating;

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (spinning && !prevSpinning.current) {
      spinEndedRef.current = false;
      const next = spinTargetRotation(segmentIndex, pointer, rotationRef.current);
      // Dos frames: primero cortar idle sin transición, luego aplicar giro
      setAnimating(false);
      requestAnimationFrame(() => {
        setRotation(rotationRef.current);
        requestAnimationFrame(() => {
          setAnimating(true);
          setRotation(next);
        });
      });
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
      endTimerRef.current = setTimeout(() => {
        if (spinEndedRef.current) return;
        spinEndedRef.current = true;
        setAnimating(false);
        onSpinEndRef.current?.();
      }, SPIN_MS + 80);
    }
    prevSpinning.current = spinning;
  }, [spinning, segmentIndex, pointer]);

  useEffect(() => {
    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{ width: clipWidth, height: wheelDiameter }}
    >
      <div
        className="absolute top-0"
        style={{
          left: isHalf ? -wheelDiameter / 2 : 0,
          width: wheelDiameter,
          height: wheelDiameter,
        }}
      >
        <div
          className={`rounded-full border-[5px] border-white shadow-xl overflow-hidden bg-white ${
            showIdle ? "roulette-idle-spin" : ""
          }`}
          style={{
            width: wheelDiameter,
            height: wheelDiameter,
            transform: showIdle ? undefined : `rotate(${rotation}deg)`,
            transition: animating
              ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.85, 0.2, 1)`
              : "none",
          }}
        >
          <svg
            width={wheelDiameter}
            height={wheelDiameter}
            viewBox={`0 0 ${wheelDiameter} ${wheelDiameter}`}
            aria-hidden
          >
            {ROULETTE_SEGMENTS.map((seg, i) => {
              const midDeg = (i + 0.5) * SEGMENT_ANGLE - 90;
              const lines = seg.wheelLines;
              return (
                <g key={`${reactId}-${i}`}>
                  <path
                    d={segmentPath(r, i)}
                    fill={seg.color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <g transform={`translate(${r}, ${r}) rotate(${midDeg})`}>
                    {lines.map((line, li) => (
                      <text
                        key={li}
                        x={textDist}
                        y={lines.length === 1 ? 0 : li === 0 ? -lineOffset : lineOffset}
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
            <circle
              cx={r}
              cy={r}
              r={r * 0.045}
              fill="#fff"
              stroke="#e2e8f0"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {pointer === "right" && (
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
          style={{
            right: isHalf ? -2 : -4,
            width: 0,
            height: 0,
            borderTop: "14px solid transparent",
            borderBottom: "14px solid transparent",
            borderLeft: "24px solid #fff",
          }}
        />
      )}
    </div>
  );
}
