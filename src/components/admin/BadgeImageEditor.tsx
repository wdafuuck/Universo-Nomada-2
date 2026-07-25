"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [applying, setApplying] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, VIEW, VIEW);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, VIEW, VIEW);

    const base = Math.min(VIEW / img.naturalWidth, VIEW / img.naturalHeight);
    const scale = base * zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (VIEW - w) / 2 + offset.x;
    const y = (VIEW - h) / 2 + offset.y;
    ctx.drawImage(img, x, y, w, h);

    // Marco suave
    ctx.strokeStyle = "rgba(45, 212, 191, 0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, VIEW - 2, VIEW - 2);
  }, [offset.x, offset.y, zoom]);

  useEffect(() => {
    if (!open || !imageSrc) {
      setReady(false);
      return;
    }
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setReady(false);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.onerror = () => setReady(false);
    img.src = imageSrc;
  }, [open, imageSrc]);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset({
      x: d.ox + (e.clientX - d.x),
      y: d.oy + (e.clientY - d.y),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const exportFile = async (): Promise<File> => {
    const img = imgRef.current;
    if (!img) throw new Error("Imagen no lista");

    const out = document.createElement("canvas");
    out.width = EXPORT;
    out.height = EXPORT;
    const ctx = out.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");

    ctx.clearRect(0, 0, EXPORT, EXPORT);
    const ratio = EXPORT / VIEW;
    const base = Math.min(VIEW / img.naturalWidth, VIEW / img.naturalHeight);
    const scale = base * zoom * ratio;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (EXPORT - w) / 2 + offset.x * ratio;
    const y = (EXPORT - h) / 2 + offset.y * ratio;
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
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="bg-[#0f1f35] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar insignia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-white/50">
            Arrastrá para centrar y usá el zoom. Se guarda el recuadro completo.
          </p>

          <div className="mx-auto w-fit rounded-2xl border border-white/15 overflow-hidden bg-black/40 touch-none">
            <canvas
              ref={canvasRef}
              width={VIEW}
              height={VIEW}
              className="block cursor-grab active:cursor-grabbing max-w-full"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-white/50 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              disabled={!ready}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-teal"
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 text-white/50 shrink-0" />
            <span className="text-xs text-white/40 w-10 text-right tabular-nums">{zoom.toFixed(1)}×</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
