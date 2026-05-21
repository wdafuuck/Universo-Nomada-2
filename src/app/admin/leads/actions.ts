"use server";

import { revalidatePath } from "next/cache";
import { LeadStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-admin";

const VALID_STATUSES = Object.values(LeadStatus) as LeadStatus[];

type ActionResult = { ok: true } | { error: string };

export async function updateLeadStatus(
  leadId: number,
  status: LeadStatus,
): Promise<ActionResult> {
  await requireAdmin();

  if (!VALID_STATUSES.includes(status)) {
    return { error: "Estado inválido" };
  }

  await db.lead.update({
    where: { id: leadId },
    data: {
      status,
      contactedAt:
        status === LeadStatus.CONTACTED || status === LeadStatus.IN_PROGRESS
          ? new Date()
          : undefined,
    },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateLeadNotes(
  leadId: number,
  notes: string,
): Promise<ActionResult> {
  await requireAdmin();

  await db.lead.update({
    where: { id: leadId },
    data: { notes: notes.trim() || null },
  });

  revalidatePath("/admin/leads");
  return { ok: true };
}
