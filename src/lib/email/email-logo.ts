import fs from "node:fs";
import path from "node:path";
import { getProjectRoot } from "@/lib/public-image-path";
import { SITE_URL } from "@/lib/site-url";

/** CID legacy (adjuntos inline). El HTML usa URL pública. */
export const EMAIL_LOGO_CID = "un-logo";

/** Logo en correos: URL absoluta pública (funciona en preview y clientes). */
export function emailLogoSrc(): string {
  return `${SITE_URL}/images/logo-un.png`;
}

export function emailLogoCidSrc(): string {
  return `cid:${EMAIL_LOGO_CID}`;
}

function logoFilePath(): string {
  const candidates = [
    path.join(getProjectRoot(), "public", "images", "logo-un.png"),
    path.join(process.cwd(), "public", "images", "logo-un.png"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0]!;
}

/** Adjunto inline para nodemailer (SMTP). */
export function smtpLogoAttachment() {
  return {
    filename: "logo-un.png",
    path: logoFilePath(),
    cid: EMAIL_LOGO_CID,
  };
}

/** Adjunto inline para Resend API. */
export function resendLogoAttachment(): {
  filename: string;
  content: string;
  content_id: string;
  content_type: string;
} | null {
  try {
    const filePath = logoFilePath();
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    return {
      filename: "logo-un.png",
      content: buffer.toString("base64"),
      content_id: EMAIL_LOGO_CID,
      content_type: "image/png",
    };
  } catch {
    return null;
  }
}
