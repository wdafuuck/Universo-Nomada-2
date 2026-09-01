import type { ReactNode } from "react";
import { INSTAGRAM_PROFILE_URL } from "@/lib/social";

/** Párrafos de contacto plano al final del artículo (contenido CMS) — se omiten; van en BlogSocialFollow. */
export function isContactFooterParagraph(para: string): boolean {
  const t = para.trim();
  if (!t) return false;
  const hits = [
    /sitio\s*web/i.test(t),
    /instagram\s*:/i.test(t),
    /whatsapp\s*:/i.test(t),
    /correo\s*:/i.test(t) || /email\s*:/i.test(t),
  ].filter(Boolean).length;
  return hits >= 2 || (hits >= 1 && /sitio\s*web\s*:/i.test(t) && t.length < 220);
}

function linkClass() {
  return "text-teal-dark font-medium underline underline-offset-2 hover:text-teal";
}

/** Convierte URLs, emails, WhatsApp e Instagram en enlaces clicables. */
export function linkifyBlogText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re =
    /(https?:\/\/[^\s]+)|((?:www\.)?universonomada\.cl\/?[^\s]*)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(@universo\.?nomadaa?)|(\+\s*56[\d\s-]{8,}|\+?\d[\d\s-]{8,}\d)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    const [full, httpUrl, site, email, ig, phone] = m;

    if (httpUrl) {
      const href = httpUrl.replace(/[.,;:)]+$/, "");
      parts.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={linkClass()}>
          {href.replace(/^https?:\/\//, "")}
        </a>,
      );
    } else if (site) {
      const href = `https://${site.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
      parts.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={linkClass()}>
          {site.replace(/^https?:\/\//, "")}
        </a>,
      );
    } else if (email) {
      parts.push(
        <a key={key++} href={`mailto:${email}`} className={linkClass()}>
          {email}
        </a>,
      );
    } else if (ig) {
      parts.push(
        <a key={key++} href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" className={linkClass()}>
          @universo.nomadaa
        </a>,
      );
    } else if (phone) {
      const digits = phone.replace(/\D/g, "");
      const waDigits = digits.startsWith("56") ? digits : `56${digits}`;
      parts.push(
        <a
          key={key++}
          href={`https://wa.me/${waDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass()}
        >
          {phone.trim()}
        </a>,
      );
    } else {
      parts.push(full);
    }
    last = m.index + full.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}
