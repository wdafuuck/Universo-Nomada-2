"use client";

import { TurnstileWidget, isTurnstileConfigured } from "@/components/TurnstileWidget";

export type AntiBotPayload = {
  turnstileToken?: string;
  _hp?: string;
};

type Props = {
  honeypot: string;
  onHoneypotChange: (value: string) => void;
  onTurnstileToken: (token: string) => void;
  onTurnstileExpire?: () => void;
  className?: string;
};

export function AntiBotFields({
  honeypot,
  onHoneypotChange,
  onTurnstileToken,
  onTurnstileExpire,
  className,
}: Props) {
  return (
    <div className={className}>
      {/* Honeypot invisible — bots lo rellenan */}
      <label className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        Sitio web
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => onHoneypotChange(e.target.value)}
        />
      </label>
      <TurnstileWidget onToken={onTurnstileToken} onExpire={onTurnstileExpire} />
    </div>
  );
}

export function buildAntiBotPayload(honeypot: string, turnstileToken: string): AntiBotPayload {
  return {
    _hp: honeypot || undefined,
    turnstileToken: turnstileToken || undefined,
  };
}

export function validateAntiBotClient(turnstileToken: string): string | null {
  if (isTurnstileConfigured() && !turnstileToken.trim()) {
    return "Completa la verificación anti-bot antes de continuar.";
  }
  return null;
}
