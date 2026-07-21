"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AdminTheme = "dark" | "light";

const STORAGE_KEY = "un_admin_theme";

type AdminThemeContextValue = {
  theme: AdminTheme;
  isLight: boolean;
  toggleTheme: () => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue>({
  theme: "dark",
  isLight: false,
  toggleTheme: () => {},
});

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next: AdminTheme = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <AdminThemeContext.Provider value={{ theme, isLight: theme === "light", toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
