"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteImage } from "@/lib/storage";
import { slugify } from "./options";

type ActionResult = { ok: true } | { error: string };

type DestinationData = {
  name: string;
  subtitle: string;
  description: string;
  image: string;
  tag: string;
  tagColor: string;
  icon: string;
  category: string;
  price: number;
  originalPrice: number | null;
  duration: string;
  highlights: string[];
  includes: string[];
  notIncludes: string[];
  active: boolean;
  order: number;
};

function parseLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

type ParseResult =
  | { ok: true; data: DestinationData }
  | { ok: false; error: string };

function parseInput(formData: FormData): ParseResult {
  const name = String(formData.get("name") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim();
  const tagColor = String(formData.get("tagColor") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const originalPriceRaw = String(formData.get("originalPrice") ?? "").trim();
  const duration = String(formData.get("duration") ?? "").trim();
  const highlights = parseLines(String(formData.get("highlights") ?? ""));
  const includes = parseLines(String(formData.get("includes") ?? ""));
  const notIncludes = parseLines(String(formData.get("notIncludes") ?? ""));
  const active = formData.get("active") === "on";
  const order = Number(formData.get("order") ?? 0);

  if (!name || !subtitle || !description || !tag || !category || !duration) {
    return { ok: false, error: "Completa nombre, subtítulo, descripción, etiqueta, categoría y duración." };
  }
  if (!image) {
    return { ok: false, error: "Falta la imagen." };
  }
  if (!tagColor) return { ok: false, error: "Selecciona un color de etiqueta." };
  if (!icon) return { ok: false, error: "Selecciona un ícono." };
  if (Number.isNaN(price) || price < 0) return { ok: false, error: "Precio inválido." };

  let originalPrice: number | null = null;
  if (originalPriceRaw) {
    const n = Number(originalPriceRaw);
    if (Number.isNaN(n) || n < 0) return { ok: false, error: "Precio original inválido." };
    originalPrice = Math.round(n);
  }

  return {
    ok: true,
    data: {
      name,
      subtitle,
      description,
      image,
      tag,
      tagColor,
      icon,
      category,
      price: Math.round(price),
      originalPrice,
      duration,
      highlights,
      includes,
      notIncludes,
      active,
      order: Number.isNaN(order) ? 0 : Math.round(order),
    },
  };
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "destino";
  let suffix = 1;
  while (await db.destination.findUnique({ where: { id: slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function createDestination(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const idRaw = String(formData.get("id") ?? "").trim();
  const id = await uniqueSlug(idRaw ? slugify(idRaw) : slugify(parsed.data.name));

  await db.destination.create({ data: { id, ...parsed.data } });
  revalidatePath("/admin/destinos");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin/destinos/${id}?saved=1`);
}

export async function updateDestination(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  await db.destination.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/destinos");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin/destinos/${id}?saved=1`);
}

export async function toggleDestinationActive(id: string): Promise<ActionResult> {
  await requireAdmin();
  const existing = await db.destination.findUnique({ where: { id } });
  if (!existing) return { error: "Destino no encontrado" };
  await db.destination.update({ where: { id }, data: { active: !existing.active } });
  revalidatePath("/admin/destinos");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteDestination(id: string): Promise<ActionResult> {
  await requireAdmin();
  const existing = await db.destination.findUnique({ where: { id } });
  if (!existing) return { error: "Destino no encontrado" };
  await db.destination.delete({ where: { id } });
  await deleteImage(existing.image);
  revalidatePath("/admin/destinos");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
