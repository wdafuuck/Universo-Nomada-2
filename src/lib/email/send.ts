import nodemailer from "nodemailer";
import { resendLogoAttachment, smtpLogoAttachment } from "@/lib/email/email-logo";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = { ok: true } | { ok: false; skipped?: boolean; error?: string };

function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() ?? "Universo Nómada <contacto@universonomada.cl>";
}

async function sendViaResend(input: SendEmailInput, from: string): Promise<SendEmailResult | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;

  const logo = resendLogoAttachment();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(logo ? { attachments: [logo] } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] Resend error:", err);
    return { ok: false, error: err };
  }

  return { ok: true };
}

async function sendViaSmtp(input: SendEmailInput, from: string): Promise<SendEmailResult | null> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: [smtpLogoAttachment()],
  });

  return { ok: true };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = input.to.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "Email inválido" };
  }

  const from = emailFrom();

  try {
    // Prioridad: Resend → si falla o no está, SMTP → si no hay config, skip (dev)
    const resend = await sendViaResend(input, from);
    if (resend?.ok) return resend;
    if (resend && !resend.ok) {
      console.warn("[email] Resend falló, intentando SMTP…", resend.error);
    }

    const smtp = await sendViaSmtp(input, from);
    if (smtp?.ok) return smtp;
    if (smtp && !smtp.ok) return smtp;

    // Resend configurado pero falló, y no hay SMTP
    if (resend && !resend.ok) return resend;

    console.log("[email:skip] Configura SMTP_HOST/SMTP_USER/SMTP_PASS o RESEND_API_KEY");
    console.log("[email:to]", to);
    console.log("[email:subject]", input.subject);
    console.log("[email:text]", input.text);
    return { ok: false, skipped: true };
  } catch (e) {
    console.error("[email]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}
