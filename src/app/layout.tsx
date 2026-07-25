import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AnnouncerProvider } from "@/contexts/AnnouncerContext";
import { CartProvider } from "@/contexts/CartContext";
import { ConditionalAnalytics } from "@/components/ConditionalAnalytics";
import { GtmNoscript } from "@/components/GtmNoscript";
import { JsonLd } from "@/components/JsonLd";
import { ReviewsJsonLd } from "@/components/seo/ReviewsJsonLd";
import { PageAmbient } from "@/components/motion/PageAmbient";
import { SkipLink } from "@/components/a11y/SkipLink";
import { CookieConsent } from "@/components/a11y/CookieConsent";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { pageMetadata, siteVerificationMetadata } from "@/lib/seo-metadata";
import { SEO_DEFAULT_KEYWORDS } from "@/lib/seo-config";
import { SITE_URL } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  ...pageMetadata({
    path: "/",
    title: "Universo Nomada | Viajes que Dejan Huella — Agencia Boutique Chile",
    description:
      "Agencia de viajes boutique en Viña del Mar y La Serena. Paquetes a Rapa Nui, Atacama, Machu Picchu, Patagonia, Brasil y Argentina. Reserva online con asesoría personalizada.",
    keywords: [...SEO_DEFAULT_KEYWORDS],
  }),
  metadataBase: new URL(SITE_URL),
  authors: [{ name: "Universo Nomada", url: SITE_URL }],
  creator: "Universo Nómada®",
  publisher: "Universo Nómada®",
  category: "travel",
  verification: siteVerificationMetadata(),
  icons: {
    icon: [
      { url: "/images/favicon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/images/logo-un.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/images/favicon-192.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/images/favicon-192.png",
  },
  manifest: "/manifest.json",
  formatDetection: { telephone: true, email: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <JsonLd />
        <ReviewsJsonLd />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <GtmNoscript />
        <LanguageProvider>
          <AnnouncerProvider>
            <CartProvider>
              <SkipLink />
              <PageAmbient />
              {children}
              <CookieConsent />
              <ServiceWorkerRegister />
            </CartProvider>
            <Toaster richColors position="top-center" />
          </AnnouncerProvider>
        </LanguageProvider>
        <ConditionalAnalytics />
      </body>
    </html>
  );
}
