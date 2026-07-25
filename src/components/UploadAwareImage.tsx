"use client";

import Image, { type ImageProps } from "next/image";

function isUploadSrc(src: ImageProps["src"]): boolean {
  return typeof src === "string" && src.startsWith("/uploads/");
}

/**
 * next/image optimizer no lee bien /uploads en prod (Caddy sirve el disco).
 * Para esas URLs se desactiva la optimización y el browser carga directo.
 */
export function UploadAwareImage({ unoptimized, src, alt, ...rest }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? isUploadSrc(src)}
      {...rest}
    />
  );
}
