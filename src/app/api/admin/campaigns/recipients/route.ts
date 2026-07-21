import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import type { CampaignAudience } from "@/lib/email/campaign-templates-data";
import { countCampaignRecipients } from "@/lib/email/campaign-recipients";

const VALID: CampaignAudience[] = ["users", "subscribers", "all"];

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const audience = (request.nextUrl.searchParams.get("audience") ?? "all") as CampaignAudience;
  if (!VALID.includes(audience)) {
    return NextResponse.json({ error: "Audiencia inválida" }, { status: 400 });
  }

  try {
    const count = await countCampaignRecipients(audience);
    return NextResponse.json({ count, audience });
  } catch (e) {
    console.error("[admin/campaigns/recipients]", e);
    return NextResponse.json({ error: "Error al contar destinatarios" }, { status: 500 });
  }
}
