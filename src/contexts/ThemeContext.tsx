"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type AppTheme = "light" | "dark";

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("act_theme") as AppTheme | null;
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark-theme");
      root.classList.remove("light-theme");
    } else {
      root.classList.add("light-theme");
      root.classList.remove("dark-theme");
    }
    localStorage.setItem("act_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

// ── Centralised token maps ────────────────────────────────────────────────────
export const LIGHT = {
  bgMain:       "#f0faf0",
  bgSidebar:    "#ffffff",
  bgHeader:     "#ffffff",
  bgCard:       "#ffffff",
  bgActive:     "#dcfce7",
  bgHover:      "#f0fdf4",
  bgBadge:      "#dcfce7",
  bgInput:      "#f0fdf4",
  border:       "#bbf0bb",
  borderHover:  "#22c55e",
  primary:      "#16a34a",
  primaryBright:"#22c55e",
  primaryMuted: "#4b8c5a",
  textPrimary:  "#111111",      // near-black — strong dark font
  textSecondary:"#2d2d2d",      // dark grey — readable on white
  textMuted:    "#555555",      // medium grey for hints
  textActive:   "#15803d",      // dark green for active nav
  navDot:       "#22c55e",
  scrollTrack:  "#f0fdf4",
  scrollThumb:  "#86efac",
  glowColor:    "rgba(34,197,94,0.25)",
  meshGrad:     `radial-gradient(at 0% 0%, rgba(34,197,94,0.12) 0px, transparent 50%),
                 radial-gradient(at 100% 0%, rgba(16,185,129,0.10) 0px, transparent 50%),
                 radial-gradient(at 50% 100%, rgba(74,222,128,0.08) 0px, transparent 50%)`,
} as const;

export const DARK = {
  bgMain:       "#060d1a",
  bgSidebar:    "#0b1628",
  bgHeader:     "#0b1628",
  bgCard:       "#0f1e35",
  bgActive:     "rgba(59,130,246,0.18)",
  bgHover:      "rgba(59,130,246,0.08)",
  bgBadge:      "rgba(59,130,246,0.18)",
  bgInput:      "#0e1c33",
  border:       "#1a3a6e",
  borderHover:  "#3b82f6",
  primary:      "#2563eb",
  primaryBright:"#60a5fa",
  primaryMuted: "#93c5fd",
  textPrimary:  "#ffffff",      // pure white — bright font on dark
  textSecondary:"#e2e8f0",      // bright off-white for secondary text
  textMuted:    "#94a3b8",      // light slate for muted hints
  textActive:   "#93c5fd",      // bright blue for active nav
  navDot:       "#3b82f6",
  scrollTrack:  "#0b1628",
  scrollThumb:  "#1e3a6e",
  glowColor:    "rgba(59,130,246,0.20)",
  meshGrad:     `radial-gradient(at 0% 0%, rgba(37,99,235,0.18) 0px, transparent 50%),
                 radial-gradient(at 100% 0%, rgba(29,78,216,0.14) 0px, transparent 50%),
                 radial-gradient(at 50% 100%, rgba(96,165,250,0.10) 0px, transparent 50%)`,
} as const;

export type ThemeTokens = typeof LIGHT;
