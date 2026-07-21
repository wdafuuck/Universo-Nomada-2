"use client";

import React, {
  createContext,
  useContext,
  useSyncExternalStore,
  useCallback,
  ReactNode,
} from "react";
import { Language, translations, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <K extends TranslationKey>(key: K) => (typeof translations)["es"][K];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_KEY = "un_language";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isLanguage(value: string | null): value is Language {
  return value !== null && value in translations;
}

function getLanguageSnapshot(): Language {
  const stored = localStorage.getItem(LANG_KEY);
  return isLanguage(stored) ? stored : "es";
}

function setStoredLanguage(lang: Language) {
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  listeners.forEach((listener) => listener());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore<Language>(subscribe, getLanguageSnapshot, () => "es");

  const setLanguage = useCallback((lang: Language) => {
    if (translations[lang]) setStoredLanguage(lang);
  }, []);

  const t = <K extends TranslationKey>(key: K) =>
    translations[language][key] as (typeof translations)["es"][K];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
