import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-session";
import { parseCampaignContent } from "@/lib/email/campaign-templates-data";
import { renderCampaignEmail } from "@/lib/email/campaign-render";

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const content = parseCampaignContent(body);
    if (!content?.subject || !content.headline) {
      return NextResponse.json({ error: "Asunto y título obligatorios" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const preview = renderCampaignEmail(content, {
      recipientName: body.previewName ? String(body.previewName) : "María",
      logoSrc: `${origin}/images/logo-un.png`,
    });

    return NextResponse.json({
      subject: preview.subject,
      html: preview.html,
      text: preview.text,
    });
  } catch (e) {
    console.error("[admin/campaigns/preview]", e);
    return NextResponse.json({ error: "Error al generar vista previa" }, { status: 500 });
  }
}
