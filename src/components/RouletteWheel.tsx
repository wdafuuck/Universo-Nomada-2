"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ROULETTE_SEGMENTS } from "@/lib/roulette-shared";

type Props = {
  segmentIndex: number;
  spinning: boolean;
  onSpinEnd?: () => void;
  size?: number;
  idle?: boolean;
  active?: boolean;
};

const SEGMENT_ANGLE = (Math.PI * 2) / ROULETTE_SEGMENTS.length;
const SPIN_MS = 3500;

function buildWheelDataUrl(diameter: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = diameter;
  canvas.height = diameter;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const r = diameter / 2;
  ctx.translate(r, r);

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
    ctx.save();
    ctx.rotate(mid);
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.max(11, Math.round(diameter / 30))}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = seg.wheelLines;
    const lineH = Math.max(12, Math.round(diameter / 34));
    for (let li = 0; li < lines.length; li++) {
      const y = lines.length === 1 ? 0 : li === 0 ? -lineH * 0.45 : lineH * 0.45;
      ctx.fillText(lines[li], r * 0.58, y, r * 0.55);
    }
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  return canvas.toDataURL("image/png");
}

function spinDegrees(segmentIndex: number): number {
  const centerDeg = (segmentIndex + 0.5) * (360 / ROULETTE_SEGMENTS.length);
  // Puntero a la derecha (90° en CSS desde arriba… usamos rotate desde 0)
  // Con dibujo empezando en -90°, el centro del segmento i está en centerDeg-90 desde +X.
  // Para alinear con el puntero derecho (+X): rotación = 360*n + (90 - (centerDeg))
  const align = 90 - centerDeg;
  return 360 * 5 + ((align % 360) + 360) % 360;
}

/**
 * Ruleta: imagen estática + CSS transition (sin rAF).
 * El rAF/canvas continuo crasheaba Safari/Chrome móvil.
 */
export function RouletteWheel({
  segmentIndex,
  spinning,
  onSpinEnd,
  size = 210,
  active = true,
}: Props) {
  const diameter = Math.round(size * 1.65);
  const [src, setSrc] = useState<string>("");
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const endedRef = useRef(false);
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;
  const rotationBaseRef = useRef(0);

  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    try {
      setSrc(buildWheelDataUrl(diameter));
    } catch {
      setSrc("");
    }
  }, [active, diameter]);

  useEffect(() => {
    if (!spinning || endedRef.current) return;
    endedRef.current = false;

    const base = rotationBaseRef.current;
    const next = base + spinDegrees(segmentIndex);
    rotationBaseRef.current = next;

    // Frame 1: sin transición; frame 2: aplicar giro
    setAnimating(false);
    setRotation(base);
    const startId = window.setTimeout(() => {
      setAnimating(true);
      setRotation(next);
    }, 40);

    const endId = window.setTimeout(() => {
      if (endedRef.current) return;
      endedRef.current = true;
      setAnimating(false);
      window.setTimeout(() => {
        try {
          onSpinEndRef.current?.();
        } catch {
          // ignore
        }
      }, 80);
    }, SPIN_MS + 80);

    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(endId);
    };
  }, [spinning, segmentIndex]);

  useEffect(() => {
    if (!spinning) endedRef.current = false;
  }, [spinning]);

  const style = useMemo(
    () => ({
      width: diameter,
      height: diameter,
      transform: `rotate(${rotation}deg)`,
      transition: animating
        ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.85, 0.2, 1)`
        : "none",
      willChange: animating ? "transform" : "auto",
    }),
    [diameter, rotation, animating],
  );

  if (!active) return null;

  return (
    <div className="relative mx-auto" style={{ width: diameter, height: diameter }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={diameter}
          height={diameter}
          draggable={false}
          className="block rounded-full select-none"
          style={style}
        />
      ) : (
        <div
          className="rounded-full bg-white/20"
          style={{ width: diameter, height: diameter }}
        />
      )}
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
