"use client";

import type { Ref } from "react";

/**
 * Hidden input named "_website" that bots fill but humans never see.
 * The /api/leads handler silently drops requests where this field is non-empty.
 *
 * Placed off-screen rather than display:none — some bots skip inputs with
 * display:none thinking they're disabled.
 */
export function Honeypot({ ref }: { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      type="text"
      name="_website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute left-[-9999px] top-0 h-0 w-0 opacity-0 pointer-events-none"
    />
  );
}
