import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universo Nomada | Viajes que Dejan Huella",
  description:
    "Vive experiencias que transforman. Viajes personalizados a Rapa Nui, Atacama, Machu Picchu, Patagonia y mas. Cotiza tu viaje gratis con Universo Nomada.",
  keywords: [
    "Universo Nomada",
    "viajes personalizados",
    "La Serena",
    "Chile",
    "Rapa Nui",
    "Atacama",
    "Machu Picchu",
    "Patagonia",
    "Uyuni",
    "turismo vivencial",
    "experiencias de viaje",
    "destinos autenticos",
  ],
  authors: [{ name: "Universo Nomada" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Universo Nomada | Viajes que Dejan Huella",
    description: "Vive experiencias que transforman. Viajes personalizados a destinos autenticos en Chile y Sudamerica.",
    siteName: "Universo Nomada",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
