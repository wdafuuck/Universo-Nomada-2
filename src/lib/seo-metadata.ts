import type { Metadata } from "next";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { hreflangAlternates, SEO_DEFAULT_KEYWORDS } from "@/lib/seo-config";

type PageMetaOpts = {
  path: string;
  title: string;
  description: string;
  image?: string;
  keywords?: string[];
  noindex?: boolean;
  type?: "website" | "article";
};

export function pageMetadata(opts: PageMetaOpts): Metadata {
  const url = absoluteUrl(opts.path);
  const image = opts.image ? absoluteUrl(opts.image) : absoluteUrl("/images/logo-un.png");
  const keywords = opts.keywords ?? [...SEO_DEFAULT_KEYWORDS];

  return {
    title: opts.title,
    description: opts.description,
    keywords,
    alternates: {
      canonical: url,
      languages: hreflangAlternates(opts.path),
    },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : { robots: { index: true, follow: true } }),
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "Universo Nómada®",
      locale: "es_CL",
      type: opts.type ?? "website",
      images: [{ url: image, width: 1563, height: 1563, alt: "Universo Nómada®" }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    other: {
      "geo.region": "CL-VS",
      "geo.placename": "Viña del Mar",
      "ICBM": "-33.0246,-71.5518",
    },
  };
}

export function siteVerificationMetadata(): Metadata["verification"] {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

export { SITE_URL };
