"use client";

import { MessageCircle, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildWhatsAppUrl } from "@/lib/translations";

type Props = {
  onCotizar: () => void;
};

export function MobileStickyBar({ onCotizar }: Props) {
  const { t } = useLanguage();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2.5 flex gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <a
        href={buildWhatsAppUrl(t("whatsappMessages").default)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-[#25D366] text-white font-bold text-sm"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
      <button
        type="button"
        onClick={onCotizar}
        className="flex-1 flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-teal text-[#070f1a] font-bold text-sm"
      >
        <FileText className="h-4 w-4" />
        {t("hero").ctaPlan}
      </button>
    </div>
  );
}
