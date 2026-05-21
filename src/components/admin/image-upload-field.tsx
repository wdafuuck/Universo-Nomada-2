"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/storage";
import { optimizeImage, formatBytes } from "@/lib/optimize-image";

/**
 * Hidden input named {name} keeps the resulting URL in the form so a parent
 * <form action={serverAction}> picks it up alongside the other fields.
 *
 * Also accepts manual URL entry as a fallback when Storage isn't available.
 */
export function ImageUploadField({
  name,
  prefix,
  defaultValue,
  label = "Imagen",
}: {
  name: string;
  prefix: string;
  defaultValue?: string | null;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [phase, setPhase] = useState<"idle" | "optimizing" | "uploading">("idle");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        setPhase("optimizing");
        const originalSize = file.size;
        const optimized = await optimizeImage(file);
        const saved = originalSize - optimized.size;

        setPhase("uploading");
        const result = await uploadImage(optimized, prefix);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          setValue(result.url);
          if (saved > 0 && optimized !== file) {
            toast.success(
              `Imagen subida · ${formatBytes(originalSize)} → ${formatBytes(optimized.size)}`,
            );
          } else {
            toast.success("Imagen subida");
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al procesar la imagen");
      } finally {
        setPhase("idle");
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  const busyLabel =
    phase === "optimizing" ? "Optimizando…" : phase === "uploading" ? "Subiendo…" : null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      {value ? (
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <Image
            src={value}
            alt="Vista previa"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized={value.startsWith("/")}
          />
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
            aria-label="Quitar imagen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <ImagePlus className="h-7 w-7 mx-auto mb-1" />
            <p className="text-xs">Sin imagen</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ImagePlus className="h-4 w-4 mr-2" />
          )}
          {busyLabel ?? (value ? "Reemplazar" : "Subir imagen")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer hover:text-slate-700">
          O pegar URL manualmente
        </summary>
        <Input
          type="url"
          placeholder="https://… o /images/archivo.png"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-2 text-xs"
        />
      </details>

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
