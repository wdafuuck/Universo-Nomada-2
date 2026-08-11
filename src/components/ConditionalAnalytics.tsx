"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getCookieConsent, hasAnalyticsConsent } from "@/lib/cookie-consent";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
/** Si es "true", solo GTM (GA4/Meta deben estar como tags en el contenedor). */
const GTM_ONLY = process.env.NEXT_PUBLIC_ANALYTICS_GTM_ONLY === "true";

function pushConsentUpdate(granted: boolean) {
  const w = window as Window & {
    dataLayer?: object[];
    gtag?: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  const gtag = function gtag(..._args: unknown[]) {
    // GTM espera el objeto Arguments (como el snippet oficial)
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments as unknown as object);
  };
  w.gtag = w.gtag || gtag;
  w.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
  });
}

/**
 * Scripts de medición solo tras «Aceptar todas» (mejor PSI + privacidad).
 * Consent Mode default queda denied hasta el update.
 */
export function ConditionalAnalytics() {
  const [analyticsOk, setAnalyticsOk] = useState(false);

  useEffect(() => {
    const sync = () => {
      const ok = hasAnalyticsConsent();
      setAnalyticsOk(ok);
      pushConsentUpdate(ok);
    };
    sync();
    window.addEventListener("un-cookie-consent", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("un-cookie-consent", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (getCookieConsent() === "all") setAnalyticsOk(true);
  }, []);

  const loadDirectGaMeta = analyticsOk && (!GTM_ID || !GTM_ONLY);

  return (
    <>
      <Script id="gtm-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
        `}
      </Script>

      {GTM_ID && analyticsOk ? (
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
