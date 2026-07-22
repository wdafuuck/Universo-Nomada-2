"use client";

import { useEffect, useRef } from "react";
import { ROULETTE_SEGMENTS } from "@/lib/roulette-shared";

type Props = {
  segmentIndex: number;
  spinning: boolean;
  onSpinEnd?: () => void;
  size?: number;
  idle?: boolean;
  /** Si false, no monta el canvas (fase resultado) */
  active?: boolean;
};

const SEGMENT_ANGLE = (Math.PI * 2) / ROULETTE_SEGMENTS.length;
const SPIN_MS = 3800;

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
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    const mid = start + SEGMENT_ANGLE / 2;
    const textR = r * 0.58;
    ctx.save();
    ctx.rotate(mid);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.max(11, Math.round(diameter / 30))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = seg.wheelLines;
    const lineH = Math.max(12, Math.round(diameter / 34));
    for (let li = 0; li < lines.length; li++) {
      const y = lines.length === 1 ? 0 : li === 0 ? -lineH * 0.45 : lineH * 0.45;
      ctx.fillText(lines[li], textR, y, r * 0.55);
    }
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.stroke();
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * Canvas + rAF. Sin CSS transform / SVG (crash en Chrome/Safari móvil al terminar).
 */
export function RouletteWheel({
  segmentIndex,
  spinning,
  onSpinEnd,
  size = 240,
  idle = false,
  active = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const spinningRef = useRef(false);
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;

  const diameter = Math.round(size * 1.65);

  const stopRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const paint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    drawWheel(ctx, diameter, rotationRef.current);
  };

  useEffect(() => {
    if (!active) {
      stopRaf();
      spinningRef.current = false;
      return;
    }
    paint();
  }, [active, diameter]);

  // Idle
  useEffect(() => {
    if (!active || !idle || spinning) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      rotationRef.current += 0.01;
      paint();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      stopRaf();
    };
  }, [active, idle, spinning, diameter]);

  // Spin
  useEffect(() => {
    if (!active || !spinning || spinningRef.current) return;
    spinningRef.current = true;
    stopRaf();

    const from = rotationRef.current;
    const centerOffset = segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const align = -centerOffset + Math.PI / 2;
    const fromNorm = ((from % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const alignNorm = ((align % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let extra = alignNorm - fromNorm;
    if (extra < 0) extra += Math.PI * 2;
    const to = from + Math.PI * 2 * 5 + extra;
    const start = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      spinningRef.current = false;
      stopRaf();
      // Fuera del frame de animación — evita crash Safari/Chrome móvil
      window.setTimeout(() => {
        try {
          onSpinEndRef.current?.();
        } catch {
          // ignore
        }
      }, 50);
    };

    const step = (now: number) => {
      if (finished) return;
      const t = Math.min(1, (now - start) / SPIN_MS);
      rotationRef.current = from + (to - from) * easeOutCubic(t);
      paint();
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        finish();
      }
    };
    rafRef.current = requestAnimationFrame(step);

    // Failsafe si el tab queda en background
    const failsafe = window.setTimeout(finish, SPIN_MS + 800);

    return () => {
      window.clearTimeout(failsafe);
      // No cancelar si ya terminó y está por llamar onSpinEnd
      if (!finished) stopRaf();
    };
  }, [active, spinning, segmentIndex, diameter]);

  if (!active) return null;

  return (
    <div className="relative mx-auto" style={{ width: diameter, height: diameter }}>
      <canvas
        ref={canvasRef}
        width={diameter}
        height={diameter}
        className="block rounded-full"
        style={{ width: diameter, height: diameter }}
        aria-hidden
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
        style={{
          right: -4,
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
