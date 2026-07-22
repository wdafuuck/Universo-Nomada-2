"use client";

import { useEffect, useRef } from "react";
import { ROULETTE_SEGMENTS } from "@/lib/roulette-shared";

type Props = {
  segmentIndex: number;
  spinning: boolean;
  onSpinEnd?: () => void;
  size?: number;
  idle?: boolean;
  display?: "half" | "full";
  /** compat — siempre puntero derecho */
  pointer?: "top" | "right";
};

const SEGMENT_ANGLE = (Math.PI * 2) / ROULETTE_SEGMENTS.length;
const SPIN_MS = 4500;

function drawWheel(
  ctx: CanvasRenderingContext2D,
  diameter: number,
  rotationRad: number,
) {
  const r = diameter / 2;
  const cx = r;
  const cy = r;
  ctx.clearRect(0, 0, diameter, diameter);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);

  for (let i = 0; i < ROULETTE_SEGMENTS.length; i++) {
    const seg = ROULETTE_SEGMENTS[i];
    const start = i * SEGMENT_ANGLE - Math.PI / 2;
    const end = start + SEGMENT_ANGLE;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - 3, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    const mid = start + SEGMENT_ANGLE / 2;
    const textR = r * 0.58;
    ctx.save();
    ctx.rotate(mid);
    ctx.fillStyle = "#fff";
    ctx.font = `800 ${Math.max(10, Math.round(diameter / 28))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = seg.wheelLines;
    const lineH = Math.max(12, Math.round(diameter / 32));
    lines.forEach((line, li) => {
      const y =
        lines.length === 1 ? 0 : li === 0 ? -lineH * 0.45 : lineH * 0.45;
      ctx.fillText(line, textR, y, r * 0.55);
    });
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();

  // borde exterior
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.stroke();
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ruleta dibujada en canvas + rAF (evita crash GPU de SVG/CSS transform en Chrome).
 */
export function RouletteWheel({
  segmentIndex,
  spinning,
  onSpinEnd,
  size = 260,
  idle = false,
  display = "full",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const spinningRef = useRef(false);
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;

  const isHalf = display === "half";
  const diameter = Math.round(size * 1.7);
  const clipW = isHalf ? Math.round(diameter / 2) : diameter;

  const paint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawWheel(ctx, diameter, rotationRef.current);
  };

  useEffect(() => {
    paint();
  }, [diameter]);

  // Idle suave
  useEffect(() => {
    if (!idle || spinning) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      rotationRef.current += 0.008;
      paint();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [idle, spinning, diameter]);

  // Giro al premio
  useEffect(() => {
    if (!spinning || spinningRef.current) return;
    spinningRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const from = rotationRef.current;
    const centerOffset = segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    // Puntero derecho: queremos el centro del segmento en ángulo 0 (eje +X)
    // En drawWheel, ángulo 0 del segmento i empieza en i*SEGMENT - PI/2
    // Centro en coords locales: centerOffset - PI/2 desde el eje +X del disco
    // Rotación del disco para alinear centro con +X: -(centerOffset - PI/2) = -centerOffset + PI/2
    const align = -centerOffset + Math.PI / 2;
    let to = from + Math.PI * 2 * 6;
    const fromNorm = ((from % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const alignNorm = ((align % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let extra = alignNorm - fromNorm;
    if (extra < 0) extra += Math.PI * 2;
    to = from + Math.PI * 2 * 6 + extra;

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / SPIN_MS);
      rotationRef.current = from + (to - from) * easeOutCubic(t);
      paint();
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        spinningRef.current = false;
        onSpinEndRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spinning, segmentIndex, diameter]);

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{ width: clipW, height: diameter }}
    >
      <canvas
        ref={canvasRef}
        width={diameter}
        height={diameter}
        className="absolute top-0 block"
        style={{ left: isHalf ? -diameter / 2 : 0, width: diameter, height: diameter }}
        aria-hidden
      />
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
    </div>
  );
}
