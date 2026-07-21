"use client";

import Image from "next/image";
import { buildWhatsAppUrl } from "@/lib/translations";
import { cn } from "@/lib/utils";

type WhatsAppButtonProps = {
  message: string;
  label?: string;
  variant?: "primary" | "outline" | "floating" | "inline";
  className?: string;
  showIcon?: boolean;
};

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <Image
      src="/images/whatsapp-icon.png"
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full"
      aria-hidden
    />
  );
}

export function WhatsAppButton({
  message,
  label,
  variant = "primary",
  className,
  showIcon = true,
}: WhatsAppButtonProps) {
  const href = buildWhatsAppUrl(message);

  if (variant === "floating") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-[68px] w-[68px] items-center justify-center rounded-full transition-transform hover:scale-110 shadow-2xl shadow-black/30",
          className
        )}
      >
        <Image
          src="/images/whatsapp-icon.png"
          alt="WhatsApp"
          width={68}
          height={68}
          className="rounded-full"
          priority
        />
      </a>
    );
  }

  const variants = {
    primary:
      "bg-[#25D366] hover:bg-[#1fb855] text-white font-bold shadow-lg shadow-[#25D366]/30",
    outline:
      "border-2 border-[#25D366] bg-white text-[#128C7E] hover:bg-[#25D366] hover:text-white font-semibold",
    inline:
      "bg-[#E8FFF1] text-[#128C7E] hover:bg-[#25D366] hover:text-white font-semibold border border-[#25D366]/30",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-4 text-base sm:text-lg transition-all duration-300 min-h-[52px]",
        variants[variant],
        className
      )}
    >
      {showIcon && <WhatsAppIcon size={variant === "inline" ? 20 : 24} />}
      {label && <span>{label}</span>}
    </a>
  );
}
