"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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

const INNER_MARGIN_RATIO = 0.10;
const OUTER_MARGIN_RATIO = 0.06;
const LINE_OFFSET_FACTOR = 0.52;

function spinTargetRotation(segmentIndex: number, pointer: "top" | "right"): number {
  const centerOffset = segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const pointerAngle = POINTER_ANGLE[pointer];
  let delta = pointerAngle - centerOffset;
  delta = ((delta % 360) + 360) % 360;
  return 360 * 6 + delta;
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

function wedgeClipPath(r: number, i: number): string {
  const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
  const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
  const inner = wedgeInner(r);
  const outer = wedgeOuter(r);
  const ox1 = r + outer * Math.cos(startAngle);
  const oy1 = r + outer * Math.sin(startAngle);
  const ox2 = r + outer * Math.cos(endAngle);
  const oy2 = r + outer * Math.sin(endAngle);
  const ix1 = r + inner * Math.cos(startAngle);
  const iy1 = r + inner * Math.sin(startAngle);
  const ix2 = r + inner * Math.cos(endAngle);
  const iy2 = r + inner * Math.sin(endAngle);
  return `M ${ox1} ${oy1} A ${outer} ${outer} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${inner} ${inner} 0 0 0 ${ix1} ${iy1} Z`;
}

function WheelDisc({
  diameter,
  rotation,
  spinning,
  idle,
  onTransitionEnd,
}: {
  diameter: number;
  rotation: number;
  spinning: boolean;
  idle: boolean;
  onTransitionEnd: (e: React.TransitionEvent<HTMLDivElement>) => void;
}) {
  const r = diameter / 2;
  const fontSize = pickFontSize(diameter);
  const textDist = wedgeMid(r);
  const lineOffset = fontSize * LINE_OFFSET_FACTOR;
  const showIdle = idle && !spinning;

  return (
    <div
      className={`rounded-full border-[5px] border-white shadow-2xl overflow-hidden bg-white ${
        showIdle ? "roulette-idle-spin" : ""
      }`}
      style={{
        width: diameter,
        height: diameter,
        transform: showIdle ? undefined : `rotate(${rotation}deg)`,
        transition: spinning ? "transform 4.5s cubic-bezier(0.15, 0.85, 0.2, 1)" : "none",
      }}
      onTransitionEnd={onTransitionEnd}
    >
      <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
        <defs>
          {ROULETTE_SEGMENTS.map((_, i) => (
            <clipPath key={`clip-${i}`} id={`roulette-clip-${i}`}>
              <path d={wedgeClipPath(r, i)} />
            </clipPath>
          ))}
        </defs>

        {ROULETTE_SEGMENTS.map((seg, i) => {
          const midDeg = (i + 0.5) * SEGMENT_ANGLE - 90;
          const lines = seg.wheelLines;

          return (
            <g key={i}>
              <path
                d={segmentPath(r, i)}
                fill={seg.color}
                stroke="#fff"
                strokeWidth="2"
              />
              <g clipPath={`url(#roulette-clip-${i})`}>
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
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              </g>
            </g>
          );
        })}
        <circle cx={r} cy={r} r={r * 0.045} fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
      </svg>
    </div>
  );
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
  const [rotation, setRotation] = useState(0);
  const prevSpinning = useRef(false);
  const spinEndedRef = useRef(false);

  const isHalf = display === "half";
  const wheelDiameter = Math.round(size * 1.85);
  const clipWidth = isHalf ? Math.round(wheelDiameter / 2) : wheelDiameter;

  useEffect(() => {
    if (spinning && !prevSpinning.current) {
      spinEndedRef.current = false;
      setRotation(spinTargetRotation(segmentIndex, pointer));
    }
    prevSpinning.current = spinning;
  }, [spinning, segmentIndex, pointer]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "transform" || !spinning || spinEndedRef.current) return;
    spinEndedRef.current = true;
    onSpinEnd?.();
  };

  return (
    <motion.div
      className="relative mx-auto overflow-hidden"
      initial={false}
      animate={{ width: clipWidth, height: wheelDiameter }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute top-0"
        initial={false}
        animate={{ left: isHalf ? -wheelDiameter / 2 : 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: wheelDiameter, height: wheelDiameter }}
      >
        <WheelDisc
          diameter={wheelDiameter}
          rotation={rotation}
          spinning={spinning}
          idle={idle}
          onTransitionEnd={handleTransitionEnd}
        />
      </motion.div>

      {pointer === "right" && (
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20"
          style={{
            right: isHalf ? -2 : -4,
            width: 0,
            height: 0,
            borderTop: "14px solid transparent",
            borderBottom: "14px solid transparent",
            borderLeft: "24px solid #fff",
            filter: "drop-shadow(2px 0 6px rgba(0,0,0,0.35))",
          }}
        />
      )}
    </motion.div>
  );
}
