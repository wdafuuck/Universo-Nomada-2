"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const VIEW = 320;
const EXPORT = 768;

type Props = {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onApply: (file: File) => Promise<void> | void;
};

export function BadgeImageEditor({ open, imageSrc, onClose, onApply }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const rafRef = useRef(0);

  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);
  const [applying, setApplying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const paint = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x: ox, y: oy } = offsetRef.current;
    const z = zoomRef.current;

    ctx.clearRect(0, 0, VIEW, VIEW);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, VIEW, VIEW);

    const base = Math.min(VIEW / img.naturalWidth, VIEW / img.naturalHeight);
    const scale = base * z;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (VIEW - w) / 2 + ox;
    const y = (VIEW - h) / 2 + oy;
    ctx.drawImage(img, x, y, w, h);

    ctx.strokeStyle = "rgba(45, 212, 191, 0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, VIEW - 2, VIEW - 2);
  };

  const schedulePaint = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(paint);
  };

  useEffect(() => {
    if (!open || !imageSrc) {
      setReady(false);
      imgRef.current = null;
      return;
    }

    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    setReady(false);

    const img = new Image();
    img.decoding = "async";
    const absolute = /^https?:\/\//i.test(imageSrc);
    if (
      absolute &&
      typeof window !== "undefined" &&
      !imageSrc.startsWith(window.location.origin)
    ) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
      schedulePaint();
    };
    img.onerror = () => {
      setReady(false);
      toast.error("No se pudo cargar la imagen para ajustar. Probá subirla de nuevo.");
    };
    img.src = imageSrc;

    return () => {
      cancelAnimationFrame(rafRef.current);
      img.onload = null;
      img.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageSrc]);

  useEffect(() => {
    if (ready) schedulePaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, zoom]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !applying && !dragRef.current) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, applying, onClose]);

  const endDrag = (canvas: HTMLCanvasElement, pointerId: number) => {
    if (dragRef.current?.pointerId === pointerId) {
      dragRef.current = null;
    }
    try {
      if (canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId);
      }
    } catch {
      /* ignore */
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready || applying) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    e.preventDefault();
    offsetRef.current = {
      x: d.ox + (e.clientX - d.x),
      y: d.oy + (e.clientY - d.y),
    };
    schedulePaint();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    endDrag(e.currentTarget, e.pointerId);
  };

  const resetCenter = () => {
    offsetRef.current = { x: 0, y: 0 };
    schedulePaint();
  };

  const exportFile = async (): Promise<File> => {
    const img = imgRef.current;
    if (!img) throw new Error("Imagen no lista");

    const out = document.createElement("canvas");
    out.width = EXPORT;
    out.height = EXPORT;
    const ctx = out.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");

    const { x: ox, y: oy } = offsetRef.current;
    const z = zoomRef.current;

    ctx.clearRect(0, 0, EXPORT, EXPORT);
    const ratio = EXPORT / VIEW;
    const base = Math.min(VIEW / img.naturalWidth, VIEW / img.naturalHeight);
    const scale = base * z * ratio;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (EXPORT - w) / 2 + ox * ratio;
    const y = (EXPORT - h) / 2 + oy * ratio;
    ctx.drawImage(img, x, y, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      out.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo exportar"))), "image/png");
    });
    return new File([blob], `insignia-${Date.now()}.png`, { type: "image/png" });
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const file = await exportFile();
      await onApply(file);
      onClose();
    } catch (e) {
      const msg =
        e instanceof Error && /tainted|security/i.test(e.message)
          ? "No se pudo exportar esa imagen. Volvé a subirla y ajustala."
          : e instanceof Error
            ? e.message
            : "Error al aplicar";
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Ajustar insignia"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !dragRef.current && !applying) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1f35] p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={applying}
          className="absolute top-4 right-4 rounded-lg p-1 text-white/50 hover:text-white hover:bg-white/10"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold pr-8">Ajustar insignia</h2>
        <p className="text-xs text-white/50 mt-2 mb-4">
          Arrastrá para mover, usá el zoom o tocá Centrar. Se guarda el recuadro completo.
        </p>

        <div className="space-y-4">
          <div className="mx-auto w-fit rounded-2xl border border-white/15 overflow-hidden bg-black/40 touch-none select-none">
            <canvas
              ref={canvasRef}
              width={VIEW}
              height={VIEW}
              className="block cursor-grab active:cursor-grabbing max-w-full"
              style={{ touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onLostPointerCapture={() => {
                dragRef.current = null;
              }}
            />
          </div>

          {!ready ? (
            <p className="text-center text-xs text-white/40 flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando imagen…
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-white/50 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              disabled={!ready || applying}
              onChange={(e) => {
                const z = Number(e.target.value);
                zoomRef.current = z;
                setZoom(z);
              }}
              className="w-full accent-teal"
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 text-white/50 shrink-0" />
            <span className="text-xs text-white/40 w-10 text-right tabular-nums">{zoom.toFixed(1)}×</span>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={!ready || applying}
            onClick={resetCenter}
            className="w-full border-white/15 bg-white/5 text-white rounded-xl"
          >
            Centrar
          </Button>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={applying}
              onClick={onClose}
              className="border-white/15 bg-white/5 text-white rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!ready || applying}
              onClick={() => void handleApply()}
              className="bg-teal text-[#070f1a] font-bold rounded-xl"
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
