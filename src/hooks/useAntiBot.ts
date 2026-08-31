"use client";

import { useCallback, useState } from "react";
import {
  buildAntiBotPayload,
  validateAntiBotClient,
  type AntiBotPayload,
} from "@/components/AntiBotFields";

export function useAntiBot() {
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const payload = useCallback(
    (): AntiBotPayload => buildAntiBotPayload(honeypot, turnstileToken),
    [honeypot, turnstileToken],
  );

  const validate = useCallback((): string | null => {
    return validateAntiBotClient(turnstileToken);
  }, [turnstileToken]);

  const reset = useCallback(() => {
    setHoneypot("");
    setTurnstileToken("");
  }, []);

  return {
    honeypot,
    setHoneypot,
    turnstileToken,
    setTurnstileToken,
    payload,
    validate,
    reset,
  };
}
