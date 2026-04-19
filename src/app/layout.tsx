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
  title: "Universo Nómada - Viajes Personalizados | La Serena, Chile",
  description:
    "Vive experiencias que dejan huella. Viajes personalizados a destinos auténticos en Chile y el mundo. Cotiza tu viaje gratis con Universo Nómada.",
  keywords: [
    "Universo Nómada",
    "viajes personalizados",
    "La Serena",
    "Chile",
    "turismo",
    "experiencias",
    "destinos auténticos",
  ],
  authors: [{ name: "Universo Nómada" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Universo Nómada - Viajes Personalizados",
    description: "Vive experiencias que dejan huella. Viajes personalizados a destinos auténticos en Chile y el mundo.",
    siteName: "Universo Nómada",
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
