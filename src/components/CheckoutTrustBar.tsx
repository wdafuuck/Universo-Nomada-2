"use client";

import Link from "next/link";
import { Shield, Clock, CreditCard, Star, ExternalLink, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function CheckoutTrustBar({ minDepositPerPerson }: { minDepositPerPerson?: number }) {
  const { t } = useLanguage();
  const trust = t("checkoutTrust") as {
    title: string;
    sernatur: string;
    response24h: string;
    depositFrom: string;
    installments?: string;
    googleReviews: string;
    cancellationPolicy: string;
    paymentMethods: string;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{trust.title}</p>
      <ul className="space-y-2.5 text-sm text-slate-700">
        <li className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-teal shrink-0 mt-0.5" />
          <span>
            {trust.sernatur}{" "}
            <a
              href={t("sernaturUrl")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal font-semibold inline-flex items-center gap-0.5 hover:underline"
            >
              SERNATUR
              <ExternalLink className="h-3 w-3" />
            </a>
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-teal shrink-0 mt-0.5" />
          <span>{trust.response24h}</span>
        </li>
        {minDepositPerPerson != null && minDepositPerPerson > 0 && (
          <li className="flex items-start gap-2.5">
            <CreditCard className="h-4 w-4 text-teal shrink-0 mt-0.5" />
            <span>
              {trust.depositFrom.replace("{amount}", `$${minDepositPerPerson.toLocaleString("es-CL")}`)}
            </span>
          </li>
        )}
        {trust.installments ? (
          <li className="flex items-start gap-2.5">
            <Wallet className="h-4 w-4 text-teal shrink-0 mt-0.5" />
            <span className="font-semibold text-slate-800">{trust.installments}</span>
          </li>
        ) : null}
        <li className="flex items-start gap-2.5">
          <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 fill-amber-500" />
          <span>{trust.googleReviews}</span>
        </li>
      </ul>
      <Link href="/politicas-cancelacion" className="text-xs text-teal font-semibold hover:underline">
        {trust.cancellationPolicy}
      </Link>
    </div>
  );
}

export function PaymentMethodBadges({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { t } = useLanguage();
  const heading = (t("checkoutTrust") as { paymentMethods: string }).paymentMethods;
  const methods = ["Crédito", "Débito", "Cuotas", "Transferencia"];
  const isDark = variant === "dark";

  return (
    <div className={isDark ? "rounded-xl border border-gray-600 bg-gray-800/90 p-3.5" : ""}>
      <span
        className={
          isDark
            ? "text-xs font-bold text-gray-200 uppercase tracking-wide w-full block mb-2.5"
            : "text-[10px] font-bold text-slate-500 uppercase tracking-wide w-full block mb-2"
        }
      >
        {heading}
      </span>
      <div className="flex flex-wrap gap-2">
        {methods.map((label) => (
          <span
            key={label}
            className={
              isDark
                ? "rounded-lg border border-gray-500 bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700"
            }
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
