"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Promotion } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { createPromotion, updatePromotion } from "./actions";

type FormPayload = Partial<Promotion>;

export function PromotionForm({
  promotion,
}: {
  promotion?: FormPayload;
}) {
  const isEdit = !!promotion?.id;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit && promotion?.id
        ? await updatePromotion(promotion.id, formData)
        : await createPromotion(formData);
      if (result && "error" in result) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  const validUntilValue = promotion?.validUntil
    ? new Date(promotion.validUntil).toISOString().slice(0, 10)
    : "";

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Field label="Título" name="title" defaultValue={promotion?.title} required />
          <Field label="Subtítulo" name="subtitle" defaultValue={promotion?.subtitle} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Descuento" name="discount" placeholder="15% OFF" defaultValue={promotion?.discount} required />
            <Field label="Destino" name="destination" placeholder="Mendoza" defaultValue={promotion?.destination} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Válida hasta"
              name="validUntil"
              type="date"
              defaultValue={validUntilValue}
              required
            />
            <Field
              label="Precio original (CLP)"
              name="originalPrice"
              type="number"
              defaultValue={promotion?.originalPrice}
              required
            />
            <Field
              label="Precio con descuento (CLP)"
              name="discountPrice"
              type="number"
              defaultValue={promotion?.discountPrice}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Emoji" name="emoji" defaultValue={promotion?.emoji ?? "🔥"} />
            <Field
              label="Orden"
              name="order"
              type="number"
              defaultValue={promotion?.order ?? 0}
            />
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 h-11">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={promotion?.active ?? true}
                  className="h-4 w-4 rounded border-slate-300 text-teal focus:ring-teal"
                />
                Activa (visible en el sitio)
              </label>
            </div>
          </div>
        </div>

        <div>
          <ImageUploadField
            name="image"
            prefix="promotions"
            defaultValue={promotion?.image ?? null}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
        <Button asChild variant="ghost" type="button">
          <Link href="/admin/promociones">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear promoción"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
      />
    </div>
  );
}
