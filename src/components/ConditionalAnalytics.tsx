"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getCookieConsent, hasAnalyticsConsent } from "@/lib/cookie-consent";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
/** Si es "true", solo GTM (GA4/Meta deben estar como tags en el contenedor). */
const GTM_ONLY = process.env.NEXT_PUBLIC_ANALYTICS_GTM_ONLY === "true";

/**
 * Analytics tras consentimiento de cookies.
 * GTM + (opcional) GA4/Meta directos hasta que migres todo al contenedor.
 */
export function ConditionalAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(hasAnalyticsConsent());
    sync();
    window.addEventListener("un-cookie-consent", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("un-cookie-consent", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (getCookieConsent() === "all") setEnabled(true);
  }, []);

  if (!enabled) return null;

  const loadDirectGaMeta = !GTM_ID || !GTM_ONLY;

  return (
    <>
      {GTM_ID ? (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      ) : null}

      {loadDirectGaMeta && GA_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}

      {loadDirectGaMeta && META_PIXEL_ID ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </>
  );
}
