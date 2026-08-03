"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

function isUploadSrc(src: ImageProps["src"]): boolean {
  return typeof src === "string" && src.startsWith("/uploads/");
}

function isLocalPublicSrc(src: ImageProps["src"]): boolean {
  return typeof src === "string" && (src.startsWith("/uploads/") || src.startsWith("/images/"));
}

/** Loader: /uploads y /images pasan por /api/img (WebP liviano). */
function mediaLoader({ src, width, quality }: ImageLoaderProps): string {
  if (typeof src === "string" && isLocalPublicSrc(src)) {
    const q = quality ?? 72;
    return `/api/img?src=${encodeURIComponent(src)}&w=${width}&q=${q}`;
  }
  // Fallback next/image default-style
  return `/_next/image?url=${encodeURIComponent(String(src))}&w=${width}&q=${quality ?? 75}`;
}

/**
 * next/image optimizer no lee bien /uploads en prod (Caddy sirve el disco).
 * Para /uploads e /images usamos /api/img (sharp → WebP).
 */
export function UploadAwareImage({
  unoptimized,
  src,
  alt,
  quality,
  ...rest
}: ImageProps) {
  const useMediaApi = isLocalPublicSrc(src) && unoptimized !== true;

  if (useMediaApi) {
    return (
      <Image
        src={src}
        alt={alt}
        loader={mediaLoader}
        unoptimized={false}
        quality={quality ?? (isUploadSrc(src) ? 72 : 75)}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? false}
      quality={quality ?? 75}
      {...rest}
    />
  );
}
