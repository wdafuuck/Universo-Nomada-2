"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Destination } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { createDestination, updateDestination } from "./actions";
import { CATEGORY_OPTIONS, TAG_COLOR_OPTIONS, ICON_OPTIONS } from "./options";

export function DestinationForm({
  destination,
}: {
  destination?: Destination;
}) {
  const isEdit = !!destination?.id;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit && destination?.id
        ? await updateDestination(destination.id, formData)
        : await createDestination(formData);
      if (result && "error" in result) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre" name="name" defaultValue={destination?.name} required />
            <Field label="Subtítulo" name="subtitle" defaultValue={destination?.subtitle} required placeholder="Isla de Pascua, Chile" />
          </div>

          {!isEdit && (
            <Field
              label="ID / Slug (opcional)"
              name="id"
              placeholder="se genera automáticamente del nombre"
            />
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Descripción <span className="text-red-500">*</span>
            </label>
            <Textarea
              name="description"
              required
              rows={3}
              defaultValue={destination?.description ?? ""}
              placeholder="Texto que aparece en la tarjeta del destino."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Etiqueta (tag)"
              name="tag"
              defaultValue={destination?.tag}
              placeholder="Cultura & Misterio"
              required
            />
            <SelectField
              label="Color etiqueta"
              name="tagColor"
              defaultValue={destination?.tagColor ?? TAG_COLOR_OPTIONS[0].value}
              required
            >
              {TAG_COLOR_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${o.swatch}`} />
                    {o.label}
                  </span>
                </SelectItem>
              ))}
            </SelectField>
            <SelectField
              label="Categoría"
              name="category"
              defaultValue={destination?.category ?? CATEGORY_OPTIONS[0].value}
              required
            >
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              label="Ícono"
              name="icon"
              defaultValue={destination?.icon ?? ICON_OPTIONS[0]}
              required
            >
              {ICON_OPTIONS.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectField>
            <Field
              label="Duración"
              name="duration"
              defaultValue={destination?.duration}
              placeholder="5 dias"
              required
            />
            <Field
              label="Orden"
              name="order"
              type="number"
              defaultValue={destination?.order ?? 0}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Precio (CLP)"
              name="price"
              type="number"
              defaultValue={destination?.price}
              required
            />
            <Field
              label="Precio original (CLP, opcional)"
              name="originalPrice"
              type="number"
              defaultValue={destination?.originalPrice ?? ""}
              placeholder="Si está en descuento"
            />
          </div>

          <ListField
            label="Destacados"
            name="highlights"
            hint="Un destacado por línea. Aparecen como bullets en la página del destino."
            defaultValue={destination?.highlights}
          />

          <ListField
            label="¿Qué incluye?"
            name="includes"
            hint="Un ítem por línea (vuelo, traslados, alojamiento, comidas, etc)."
            defaultValue={destination?.includes}
          />

          <ListField
            label="¿Qué no incluye?"
            name="notIncludes"
            hint="Un ítem por línea."
            defaultValue={destination?.notIncludes}
          />

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={destination?.active ?? true}
              className="h-4 w-4 rounded border-slate-300 text-teal focus:ring-teal"
            />
            Activo (visible en el sitio)
          </label>
        </div>

        <div>
          <ImageUploadField
            name="image"
            prefix="destinations"
            defaultValue={destination?.image ?? null}
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
          <Link href="/admin/destinos">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear destino"}
        </Button>
      </div>
    </form>
  );
}

function ListField({
  label,
  name,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  hint?: string;
  defaultValue?: string[] | null;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <Textarea
        id={name}
        name={name}
        rows={4}
        defaultValue={defaultValue?.join("\n") ?? ""}
        className="text-sm font-mono"
        placeholder="Ej:&#10;Visita a los moais&#10;Playa de Anakena&#10;Volcán Rano Raraku"
      />
    </div>
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

function SelectField({
  label,
  name,
  defaultValue,
  required,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
