import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/otp-auth";

/**
 * Fusiona `fromUserId` dentro de `intoUserId` (viajes, insignias, asignaciones)
 * y elimina la cuenta origen. Ambos deben existir.
 */
export async function mergeUserInto(intoUserId: string, fromUserId: string): Promise<void> {
  if (intoUserId === fromUserId) return;

  const [into, from] = await Promise.all([
    db.user.findUnique({ where: { id: intoUserId } }),
    db.user.findUnique({ where: { id: fromUserId } }),
  ]);
  if (!into || !from) throw new Error("Cliente no encontrado para fusionar");

  await db.lead.updateMany({
    where: { userId: fromUserId },
    data: { userId: intoUserId, email: into.email },
  });

  await db.lead.updateMany({
    where: { assignedToUserId: fromUserId },
    data: { assignedToUserId: intoUserId },
  });

  await db.leadNote.updateMany({
    where: { authorId: fromUserId },
    data: { authorId: intoUserId },
  }).catch(() => {});

  const fromBadges = await db.userPassportBadge.findMany({ where: { userId: fromUserId } });
  for (const badge of fromBadges) {
    const already = await db.userPassportBadge.findUnique({
      where: { userId_badgeId: { userId: intoUserId, badgeId: badge.badgeId } },
    });
    if (already) {
      await db.userPassportBadge.delete({ where: { id: badge.id } });
    } else {
      await db.userPassportBadge.update({
        where: { id: badge.id },
        data: { userId: intoUserId },
      });
    }
  }

  if (!into.name?.trim() && from.name?.trim()) {
    await db.user.update({ where: { id: intoUserId }, data: { name: from.name } });
  }
  if (!into.emailVerifiedAt && from.emailVerifiedAt) {
    await db.user.update({
      where: { id: intoUserId },
      data: { emailVerifiedAt: from.emailVerifiedAt },
    });
  }

  await db.user.delete({ where: { id: fromUserId } });
}

/** Actualiza email del cliente y sincroniza todos sus leads. Si el correo ya existe, fusiona. */
export async function updateUserEmailWithMerge(
  userId: string,
  rawEmail: string,
  opts?: { name?: string | null },
): Promise<{ user: { id: string; email: string; name: string | null }; merged: boolean; mergedFromEmail: string | null }> {
  const email = normalizeEmail(rawEmail);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Correo inválido");
  }

  const current = await db.user.findUnique({ where: { id: userId } });
  if (!current) throw new Error("Cliente no encontrado");
  if (current.role !== "user") throw new Error("Solo se pueden editar clientes (rol user)");

  const other = await db.user.findUnique({ where: { email } });
  let merged = false;
  let mergedFromEmail: string | null = null;

  if (other && other.id !== userId) {
    if (other.role !== "user") {
      throw new Error("Ese correo pertenece a una cuenta de staff; no se puede fusionar");
    }
    mergedFromEmail = other.email;
    // Primero mover la cuenta conflictiva a un email temporal, luego absorber en current
    const tempEmail = `__merge_${other.id}@temp.local`;
    await db.user.update({ where: { id: other.id }, data: { email: tempEmail } });
    await mergeUserInto(userId, other.id);
    merged = true;
  }

  const user = await db.user.update({
    where: { id: userId },
    data: {
      email,
      ...(opts?.name !== undefined ? { name: opts.name?.trim() || null } : {}),
    },
    select: { id: true, email: true, name: true },
  });

  await db.lead.updateMany({
    where: { userId },
    data: { email },
  });

  // Vincular leads huérfanos del nuevo correo
  await db.lead.updateMany({
    where: { email, userId: null },
    data: { userId },
  });

  // Carritos abandonados / ruleta: renombrar si no hay conflicto
  await reassignUniqueEmail("cartAbandonment", current.email, email);
  await reassignUniqueEmail("rouletteSpin", current.email, email);
  await reassignUniqueEmail("blogSubscriber", current.email, email);

  return { user, merged, mergedFromEmail };
}

async function reassignUniqueEmail(
  model: "cartAbandonment" | "rouletteSpin" | "blogSubscriber",
  fromEmail: string,
  toEmail: string,
) {
  if (fromEmail === toEmail) return;
  const delegate = (db as unknown as Record<string, { findUnique: Function; update: Function; delete: Function }>)[model];
  if (!delegate?.findUnique) return;
  try {
    const oldRow = await delegate.findUnique({ where: { email: fromEmail } });
    if (!oldRow) return;
    const newRow = await delegate.findUnique({ where: { email: toEmail } });
    if (newRow) {
      await delegate.delete({ where: { email: fromEmail } });
      return;
    }
    await delegate.update({ where: { email: fromEmail }, data: { email: toEmail } });
  } catch {
    /* modelo o constraint — no bloquear el cambio de cliente */
  }
}
