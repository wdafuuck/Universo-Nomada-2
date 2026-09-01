"use client";

import { useState } from "react";
import { Instagram, Mail, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";
import { trackGenerateLead } from "@/lib/analytics-events";

type BlogNewsletterProps = {
  variant?: "light" | "dark";
  compact?: boolean;
  /** Si true, no muestra el bloque Instagram (p. ej. cuando el post ya tiene BlogSocialFollow). */
  hideSocial?: boolean;
};

export function BlogNewsletter({ variant = "light", compact = false, hideSocial = false }: BlogNewsletterProps) {
  const { t } = useLanguage();
  const b = t("blog");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isDark = variant === "dark";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/blog-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, marketingConsent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      trackGenerateLead({ source: "newsletter-blog" });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : b.newsletterError);
    }
  }

  const cardClass = isDark
    ? "bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl"
    : "bg-white border border-slate-200 rounded-2xl shadow-sm";

  const textClass = isDark ? "text-white" : "text-slate-900";
  const mutedClass = isDark ? "text-white/65" : "text-slate-500";

  return (
    <div className={`${cardClass} ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${isDark ? "bg-teal/20" : "bg-teal/10"}`}>
          <Mail className={`h-5 w-5 ${isDark ? "text-teal-300" : "text-teal"}`} />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${textClass}`}>{b.newsletterTitle}</h3>
          <p className={`mt-1 text-sm leading-relaxed ${mutedClass}`}>{b.newsletterDesc}</p>
        </div>
      </div>

      {status === "success" ? (
        <p className={`flex items-center gap-2 text-sm font-medium ${isDark ? "text-teal-300" : "text-teal"}`}>
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {b.newsletterSuccess}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={b.newsletterPlaceholder}
            className={`flex-1 min-h-[48px] rounded-xl px-4 text-sm border focus:outline-none focus:ring-2 focus:ring-teal ${
              isDark
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/40"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
            }`}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="min-h-[48px] px-6 rounded-xl bg-teal hover:bg-teal-dark text-navy font-bold text-sm transition-colors disabled:opacity-60"
          >
            {status === "loading" ? b.newsletterSending : b.newsletterCta}
          </button>
        </form>
      )}

      <label className={`mt-3 flex items-start gap-2 text-xs cursor-pointer ${mutedClass}`}>
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          className="mt-0.5 rounded border-slate-300 text-teal focus:ring-teal"
        />
        <span>
          {(b as { newsletterConsent?: string }).newsletterConsent ?? "Acepto recibir novedades y ofertas de viaje por correo."}
        </span>
      </label>

      {status === "error" && errorMsg && (
        <p className="mt-2 text-sm text-red-400">{errorMsg}</p>
      )}

      {!hideSocial ? (
        <div className={`mt-5 pt-5 border-t ${isDark ? "border-white/10" : "border-slate-100"}`}>
          <p className={`text-sm ${mutedClass} mb-3`}>{b.instagramDesc}</p>
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
              isDark ? "text-pink-300 hover:text-pink-200" : "text-pink-600 hover:text-pink-700"
            }`}
          >
            <Instagram className="h-4 w-4" />
            @universo.nomadaa — {b.instagramCta}
          </a>
        </div>
      ) : null}
    </div>
  );
}
