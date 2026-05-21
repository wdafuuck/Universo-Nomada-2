"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteImage } from "@/lib/storage";

type ActionResult = { ok: true } | { error: string };

type PromotionData = {
  title: string;
  subtitle: string;
  discount: string;
  destination: string;
  validUntil: Date;
  originalPrice: number;
  discountPrice: number;
  emoji: string;
  image: string | null;
  active: boolean;
  order: number;
};

type ParseResult =
  | { ok: true; data: PromotionData }
  | { ok: false; error: string };

function parseInput(formData: FormData): ParseResult {
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const discount = String(formData.get("discount") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const validUntilStr = String(formData.get("validUntil") ?? "").trim();
  const originalPrice = Number(formData.get("originalPrice") ?? 0);
  const discountPrice = Number(formData.get("discountPrice") ?? 0);
  const emoji = String(formData.get("emoji") ?? "🔥").trim() || "🔥";
  const image = String(formData.get("image") ?? "").trim() || null;
  const active = formData.get("active") === "on";
  const order = Number(formData.get("order") ?? 0);

  if (!title || !subtitle || !discount || !destination || !validUntilStr) {
    return { ok: false, error: "Completa título, subtítulo, descuento, destino y validez." };
  }
  const validUntil = new Date(validUntilStr);
  if (Number.isNaN(validUntil.getTime())) {
    return { ok: false, error: "Fecha de validez inválida." };
  }
  if (Number.isNaN(originalPrice) || originalPrice < 0) {
    return { ok: false, error: "Precio original inválido." };
  }
  if (Number.isNaN(discountPrice) || discountPrice < 0) {
    return { ok: false, error: "Precio con descuento inválido." };
  }

  return {
    ok: true,
    data: {
      title,
      subtitle,
      discount,
      destination,
      validUntil,
      originalPrice: Math.round(originalPrice),
      discountPrice: Math.round(discountPrice),
      emoji,
      image,
      active,
      order: Number.isNaN(order) ? 0 : Math.round(order),
    },
  };
}

export async function createPromotion(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const created = await db.promotion.create({ data: parsed.data });
  revalidatePath("/admin/promociones");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin/promociones/${created.id}?saved=1`);
}

export async function updatePromotion(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  await db.promotion.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/promociones");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin/promociones/${id}?saved=1`);
}

export async function togglePromotionActive(id: number): Promise<ActionResult> {
  await requireAdmin();
  const existing = await db.promotion.findUnique({ where: { id } });
  if (!existing) return { error: "Promoción no encontrada" };
  await db.promotion.update({ where: { id }, data: { active: !existing.active } });
  revalidatePath("/admin/promociones");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function deletePromotion(id: number): Promise<ActionResult> {
  await requireAdmin();
  const existing = await db.promotion.findUnique({ where: { id } });
  if (!existing) return { error: "Promoción no encontrada" };
  await db.promotion.delete({ where: { id } });
  await deleteImage(existing.image);
  revalidatePath("/admin/promociones");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
