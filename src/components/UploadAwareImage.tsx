"use client";

import { useState } from "react";
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
  return `/_next/image?url=${encodeURIComponent(String(src))}&w=${width}&q=${quality ?? 75}`;
}

/**
 * next/image optimizer no lee bien /uploads en prod (Caddy sirve el disco).
 * Para /uploads e /images usamos /api/img (sharp → WebP).
 * Si /api/img falla, cae al archivo directo en /uploads (Caddy).
 */
export function UploadAwareImage({
  unoptimized,
  src,
  alt,
  quality,
  onError,
  ...rest
}: ImageProps) {
  const [useDirectSrc, setUseDirectSrc] = useState(false);
  const useMediaApi = isLocalPublicSrc(src) && unoptimized !== true && !useDirectSrc;

  const handleError: NonNullable<ImageProps["onError"]> = (event) => {
    if (isLocalPublicSrc(src) && !useDirectSrc) {
      setUseDirectSrc(true);
    }
    onError?.(event);
  };

  if (useMediaApi) {
    return (
      <Image
        src={src}
        alt={alt}
        loader={mediaLoader}
        unoptimized={false}
        quality={quality ?? (isUploadSrc(src) ? 72 : 75)}
        onError={handleError}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={useDirectSrc || unoptimized === true}
      quality={quality ?? 75}
      onError={onError}
      {...rest}
    />
  );
}
