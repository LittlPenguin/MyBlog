export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "myblog.theme.v1";

type ThemeRoot = {
  setAttribute(name: string, value: string): void;
};

type ThemeStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function normalizeThemeMode(value: string | null | undefined): ThemeMode | null {
  return value === "light" || value === "dark" ? value : null;
}

export function resolveThemeMode(
  storedTheme: string | null | undefined,
  prefersDark: boolean,
): ThemeMode {
  return normalizeThemeMode(storedTheme) ?? (prefersDark ? "dark" : "light");
}

export function toggleThemeMode(mode: ThemeMode): ThemeMode {
  return mode === "dark" ? "light" : "dark";
}

export function applyThemeMode(theme: ThemeMode, root: ThemeRoot | null | undefined): ThemeMode {
  root?.setAttribute("data-theme", theme);
  return theme;
}

export function persistThemeMode(theme: ThemeMode, storage: ThemeStorage | null | undefined): ThemeMode {
  storage?.setItem(THEME_STORAGE_KEY, theme);
  return theme;
}

export function createThemeInitScript() {
  return `
    (() => {
      try {
        const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
        const storage =
          typeof window !== "undefined" && window.localStorage
            ? window.localStorage
            : typeof globalThis !== "undefined" && "localStorage" in globalThis
              ? globalThis.localStorage
              : null;
        const mediaTarget =
          typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window
            : typeof globalThis !== "undefined" && typeof globalThis.matchMedia === "function"
              ? globalThis
              : null;
        const storedTheme = storage ? storage.getItem(storageKey) : null;
        const prefersDark =
          !!mediaTarget && mediaTarget.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme =
          storedTheme === "light" || storedTheme === "dark"
            ? storedTheme
            : prefersDark
              ? "dark"
              : "light";

        document.documentElement.setAttribute("data-theme", theme);
      } catch (error) {
        document.documentElement.setAttribute("data-theme", "light");
      }
    })();
  `;
}
