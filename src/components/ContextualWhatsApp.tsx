"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildWhatsAppUrl } from "@/lib/translations";

const SECTION_MESSAGES: Record<string, string> = {
  ofertas: "Hola! Vi las ofertas en la web y quiero más información.",
  "viajes-grupales": "Hola! Me interesa un viaje grupal. ¿Qué cupos hay disponibles?",
  destinos: "Hola! Quiero cotizar una experiencia que vi en destinos.",
  nosotros: "Hola! Conocí su historia y me gustaría planificar un viaje con ustedes.",
  resenas: "Hola! Vi las reseñas y quiero cotizar mi viaje.",
  testimonios: "Hola! Vi las reseñas y quiero cotizar mi viaje.",
  blog: "Hola! Leí el blog y me interesa una experiencia similar.",
  contacto: "Hola! Quiero cotizar mi viaje con Universo Nómada.",
};

export function ContextualWhatsApp() {
  const { t } = useLanguage();
  const [message, setMessage] = useState<string>(t("whatsappMessages").default);

  useEffect(() => {
    const sections = Object.keys(SECTION_MESSAGES);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id && SECTION_MESSAGES[visible.target.id]) {
          setMessage(SECTION_MESSAGES[visible.target.id]);
        }
      },
      { threshold: 0.35, rootMargin: "-80px 0px" },
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const href = buildWhatsAppUrl(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-[68px] w-[68px] items-center justify-center rounded-full transition-transform hover:scale-110 shadow-2xl shadow-black/30 max-md:bottom-20"
    >
      <Image src="/images/whatsapp-icon.png" alt="WhatsApp" width={68} height={68} className="rounded-full" priority />
    </a>
  );
}
