"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import {
  applyThemeMode,
  normalizeThemeMode,
  persistThemeMode,
  resolveThemeMode,
  THEME_STORAGE_KEY,
  toggleThemeMode,
  type ThemeMode,
} from "@/lib/theme";

function readPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  return resolveThemeMode(storedTheme, prefersDark);
}

export function ThemeToggleButton() {
  const reduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolvedTheme = readPreferredTheme();
    applyThemeMode(resolvedTheme, document.documentElement);
    setTheme(resolvedTheme);
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const nextTheme = toggleThemeMode(theme);
    applyThemeMode(nextTheme, document.documentElement);
    persistThemeMode(nextTheme, window.localStorage);
    setTheme(nextTheme);
  };

  const iconKey = mounted ? theme : "light";
  const isDark = iconKey === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "切换到明亮模式" : "切换到暗黑模式"}
      title={isDark ? "切换到明亮模式" : "切换到暗黑模式"}
      className="shell-topbar-button shell-theme-toggle"
      onClick={handleToggle}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={iconKey}
          className="shell-theme-toggle-icon"
          initial={reduceMotion ? false : { opacity: 0, rotate: -70, scale: 0.72, y: 4 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 70, scale: 0.72, y: -4 }}
          transition={{ duration: reduceMotion ? 0.16 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
