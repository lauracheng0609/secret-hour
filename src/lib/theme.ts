"use client";

import { useEffect, useState } from "react";

export type Theme = "purple" | "hamnet";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "purple";
  return (localStorage.getItem("sh_theme") as Theme) ?? "purple";
}

export function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove("theme-purple", "theme-hamnet");
  html.classList.add(`theme-${theme}`);
  localStorage.setItem("sh_theme", theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("purple");

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    applyTheme(t);
  }

  function toggle() {
    setTheme(theme === "purple" ? "hamnet" : "purple");
  }

  return { theme, setTheme, toggle };
}
