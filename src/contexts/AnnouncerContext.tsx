"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type AnnouncerContextValue = {
  announce: (message: string) => void;
};

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");

  const announce = useCallback((text: string) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(text));
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
      {children}
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer() {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) return { announce: () => {} };
  return ctx;
}
