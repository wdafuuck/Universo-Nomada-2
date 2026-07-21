import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/otp-auth";
import type { CampaignAudience } from "@/lib/email/campaign-templates-data";

export type { CampaignAudience } from "@/lib/email/campaign-templates-data";

export type CampaignRecipient = {
  email: string;
  name: string | null;
  source: "user" | "subscriber";
};

export async function fetchCampaignRecipients(audience: CampaignAudience): Promise<CampaignRecipient[]> {
  const byEmail = new Map<string, CampaignRecipient>();

  if (audience === "users" || audience === "all") {
    const users = await db.user.findMany({
      where: { role: "user" },
      select: { email: true, name: true },
    });
    for (const user of users) {
      const email = normalizeEmail(user.email);
      if (!email) continue;
      byEmail.set(email, { email, name: user.name, source: "user" });
    }
  }

  if (audience === "subscribers" || audience === "all") {
    const subscribers = await db.blogSubscriber.findMany({
      select: { email: true },
    });
    for (const sub of subscribers) {
      const email = normalizeEmail(sub.email);
      if (!email || byEmail.has(email)) continue;
      byEmail.set(email, { email, name: null, source: "subscriber" });
    }
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function countCampaignRecipients(audience: CampaignAudience): Promise<number> {
  const list = await fetchCampaignRecipients(audience);
  return list.length;
}
