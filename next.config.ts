import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
/** Solo con dominio HTTPS real. En pruebas por IP (:3001) no forzar upgrade a https. */
const forceHttps =
  process.env.FORCE_HTTPS === "true" ||
  (isProd && (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"));

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com https://api.sumup.com https://api.mercadopago.com https://*.liteapi.travel",
  "frame-src 'self' https://*.sumup.com https://*.mercadopago.com https://www.facebook.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://wa.me https://*.sumup.com https://*.mercadopago.com",
  "frame-ancestors 'none'",
  ...(forceHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
  { key: "Content-Security-Policy", value: csp },
  ...(forceHttps
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.0.4"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  reactStrictMode: false,
  images: {
    qualities: [75, 80, 85, 90, 95],
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
      { protocol: "https", hostname: "streetviewpixels-pa.googleapis.com" },
    ],
  },
};

export default nextConfig;
