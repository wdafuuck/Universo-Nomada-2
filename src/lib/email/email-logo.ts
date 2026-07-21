import fs from "node:fs";
import path from "node:path";

/** CID usado en plantillas HTML: <img src="cid:un-logo" /> */
export const EMAIL_LOGO_CID = "un-logo";

export function emailLogoSrc(): string {
  return `cid:${EMAIL_LOGO_CID}`;
}

function logoFilePath(): string {
  return path.join(process.cwd(), "public/images/logo-un.png");
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
export function resendLogoAttachment(): { filename: string; content: string; content_id: string; content_type: string } | null {
  try {
    const filePath = logoFilePath();
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    return {
      filename: "logo-un.png",
      content: buffer.toString("base64"),
      content_id: EMAIL_LOGO_CID,
      content_type: "image/jpeg",
    };
  } catch {
    return null;
  }
}
