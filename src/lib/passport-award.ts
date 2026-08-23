import { db } from "@/lib/db";
import { fetchMemberTripsForUser } from "@/lib/member-data";
import { resolveTripEndDateFromCart } from "@/lib/trip-dates";
import { TRIP_SOURCES } from "@/lib/trip-documents";
import { normalizeEmail } from "@/lib/otp-auth";
import {
  badgeFromRow,
  computeEarnedBadges,
  tripsEligibleForBadges,
  type EarnedBadge,
  type PassportBadgeDef,
} from "@/lib/passport-badges";
import { sendPassportBadgeEmail } from "@/lib/email/passport-badge-email";

async function loadActiveBadgeDefs(): Promise<PassportBadgeDef[]> {
  // Solo insignias activas creadas/gestionadas en admin — no auto-crear.
  const rows = await db.passportBadge.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map(badgeFromRow);
}

/**
 * Persiste insignias ganadas según viajes pasados del usuario.
 * Idempotente (unique userId+badgeId). Envía correo si hay nuevas.
 */
export async function syncPassportBadgesForUser(
  userId: string,
  email: string,
  opts?: { sendEmail?: boolean; customerName?: string },
): Promise<{
  earned: EarnedBadge[];
  locked: PassportBadgeDef[];
  newlyAwarded: EarnedBadge[];
  totalPastTrips: number;
  emailSent: boolean;
}> {
  const definitions = await loadActiveBadgeDefs();
  const trips = await fetchMemberTripsForUser(userId, email);
  const eligible = tripsEligibleForBadges(trips);

  const leadIds = trips.map((t) => Number(t.leadId)).filter((n) => Number.isFinite(n));
  const leads =
    leadIds.length > 0
      ? await db.lead.findMany({
          where: { id: { in: leadIds } },
          select: { id: true, cartJson: true },
        })
      : [];
  const cartJsonByLeadId = Object.fromEntries(
    leads.map((l) => [String(l.id), l.cartJson]),
  );

  const computed = computeEarnedBadges(definitions, trips, cartJsonByLeadId);
  const newlyAwarded: EarnedBadge[] = [];

  for (const badge of computed) {
    const leadId = Number(badge.tripId);
    const earnedAt = new Date(badge.earnedAt);
    const safeEarnedAt = Number.isNaN(earnedAt.getTime()) ? new Date() : earnedAt;

    try {
      await db.userPassportBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          leadId: Number.isFinite(leadId) ? leadId : null,
          earnedAt: safeEarnedAt,
        },
      });
      newlyAwarded.push(badge);
    } catch {
      // unique violation → ya la tenía
    }
  }

  let emailSent = false;
  if (newlyAwarded.length > 0 && opts?.sendEmail !== false) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      const name = opts?.customerName || user?.name || email.split("@")[0] || "Viajero";
      const result = await sendPassportBadgeEmail({
        to: email,
        customerName: name,
        badges: newlyAwarded,
      });
      emailSent = Boolean(result.ok);
    } catch (e) {
      console.error("[passport-award] email", e);
    }
  }

  const persisted = await db.userPassportBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });

  const earned: EarnedBadge[] = persisted
    .filter((p) => p.badge.active)
    .map((p) => ({
      ...badgeFromRow(p.badge),
      earnedAt: p.earnedAt.toISOString(),
      tripId: p.leadId != null ? String(p.leadId) : "",
    }));

  const earnedIds = new Set(earned.map((b) => b.id));
  const locked = definitions.filter((b) => !earnedIds.has(b.id));

  return { earned, locked, newlyAwarded, totalPastTrips: eligible.length, emailSent };
}

/**
 * Marca como "viajo" reservas cuya fecha de fin ya pasó y otorga insignias.
 */
export async function processCompletedTripsForBadges(limit = 80): Promise<{
  markedViajo: number;
  badgesAwarded: number;
  usersSynced: number;
}> {
  const now = new Date();
  const candidates = await db.lead.findMany({
    where: {
      source: { in: [...TRIP_SOURCES] },
      status: { notIn: ["cancelado", "viajo"] },
      email: { notIn: ["carrito@universonomada.cl", ""] },
    },
    orderBy: { updatedAt: "desc" },
    take: limit * 3,
  });

  let markedViajo = 0;
  let badgesAwarded = 0;
  const usersToSync = new Map<string, string>(); // userId → email

  for (const lead of candidates) {
    const end = lead.tripEndDate ?? resolveTripEndDateFromCart(lead.cartJson);
    if (!end || end > now) continue;

    await db.lead.update({
      where: { id: lead.id },
      data: {
        status: "viajo",
        tripEndDate: lead.tripEndDate ?? end,
      },
    });
    markedViajo++;

    let userId = lead.userId;
    const email = normalizeEmail(lead.email);
    if (!userId && email) {
      const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } });
      if (user) {
        userId = user.id;
        await db.lead.update({
          where: { id: lead.id },
          data: { userId: user.id },
        });
      }
    }
    if (userId && email) usersToSync.set(userId, email);

    if (markedViajo >= limit) break;
  }

  // También sincronizar usuarios con leads ya en "viajo" sin insignia aún
  const recentViajo = await db.lead.findMany({
    where: {
      status: "viajo",
      OR: [{ userId: { not: null } }, { email: { not: "" } }],
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: { userId: true, email: true },
  });
  for (const lead of recentViajo) {
    const email = normalizeEmail(lead.email);
    if (lead.userId && email) usersToSync.set(lead.userId, email);
    else if (email) {
      const user = await db.user.findUnique({ where: { email }, select: { id: true } });
      if (user) usersToSync.set(user.id, email);
    }
  }

  let usersSynced = 0;
  for (const [userId, email] of usersToSync) {
    const result = await syncPassportBadgesForUser(userId, email);
    badgesAwarded += result.newlyAwarded.length;
    usersSynced++;
  }

  return { markedViajo, badgesAwarded, usersSynced };
}

/** Otorga insignias al marcar un lead concreto como viajo. */
export async function awardBadgesForLeadId(leadId: number): Promise<number> {
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.status === "cancelado") return 0;

  let userId = lead.userId;
  const email = normalizeEmail(lead.email);
  if (!userId && email) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    userId = user?.id ?? null;
    if (userId) {
      await db.lead.update({ where: { id: leadId }, data: { userId } });
    }
  }
  if (!userId || !email) return 0;

  const result = await syncPassportBadgesForUser(userId, email);
  return result.newlyAwarded.length;
}
