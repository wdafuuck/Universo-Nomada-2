/**
 * Prueba envío SMTP: node --env-file=.env scripts/test-email.mjs [email]
 */
import nodemailer from "nodemailer";

const to = process.argv[2]?.trim() || process.env.SMTP_USER?.trim();
const host = process.env.SMTP_HOST?.trim();
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim();

if (!host || !user || !pass) {
  console.error("❌ Falta SMTP_HOST, SMTP_USER o SMTP_PASS en .env");
  process.exit(1);
}

const port = Number(process.env.SMTP_PORT ?? 587);
const secure = process.env.SMTP_SECURE === "true" || port === 465;

const transporter = nodemailer.createTransport({
  host, port, secure, auth: { user, pass },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 20_000,
});

try {
  await transporter.verify();
  console.log("✅ Conexión SMTP OK");

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM?.trim() ?? user,
    to,
    subject: "Prueba Universo Nómada",
    text: "Si recibes esto, el correo de reservas está configurado correctamente.",
  });
  console.log("✅ Correo enviado a", to, "—", info.messageId);
} catch (e) {
  console.error("❌ Error SMTP:", e.message);
  process.exit(1);
}
