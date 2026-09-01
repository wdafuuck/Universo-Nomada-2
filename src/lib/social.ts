import { SITE_URL } from "@/lib/site-url";

/** Redes oficiales Universo Nómada (fuente única para blog, footer, SEO). */
export const SOCIAL_LINKS = [
  {
    id: "instagram",
    label: "Instagram",
    handle: "@universo.nomadaa",
    href: "https://www.instagram.com/universo.nomadaa/",
    emoji: "📸",
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@universo.nomadaa",
    href: "https://www.tiktok.com/@universo.nomadaa",
    emoji: "🎵",
  },
  {
    id: "facebook",
    label: "Facebook",
    handle: "Universo Nómada en Facebook",
    href: "https://web.facebook.com/profile.php?id=61560104283524",
    emoji: "👥",
  },
  {
    id: "website",
    label: "Sitio web",
    handle: "universonomada.cl",
    href: SITE_URL,
    emoji: "🌐",
  },
] as const;

export const INSTAGRAM_PROFILE_URL = SOCIAL_LINKS[0].href;
export const TIKTOK_PROFILE_URL = SOCIAL_LINKS[1].href;
export const FACEBOOK_PROFILE_URL = SOCIAL_LINKS[2].href;
