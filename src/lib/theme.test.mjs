import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { Script, createContext } from "node:vm";
import {
  THEME_STORAGE_KEY,
  createThemeInitScript,
  normalizeThemeMode,
  resolveThemeMode,
  toggleThemeMode,
} from "./theme.ts";

function runThemeInitScript({ storedTheme = null, prefersDark = false } = {}) {
  const attributes = {};
  const storage = new Map();

  if (storedTheme !== null) {
    storage.set(THEME_STORAGE_KEY, storedTheme);
  }

  const sandbox = {
    window: {
      matchMedia: (query) => ({
        matches: prefersDark && query === "(prefers-color-scheme: dark)",
      }),
    },
    document: {
      documentElement: {
        dataset: {},
        setAttribute(name, value) {
          attributes[name] = value;
          if (name === "data-theme") {
            this.dataset.theme = value;
          }
        },
      },
    },
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, value);
      },
    },
  };

  createContext(sandbox);
  new Script(createThemeInitScript()).runInContext(sandbox);

  return attributes["data-theme"] ?? null;
}

test("normalizeThemeMode accepts only light and dark", () => {
  assert.equal(normalizeThemeMode("light"), "light");
  assert.equal(normalizeThemeMode("dark"), "dark");
  assert.equal(normalizeThemeMode("system"), null);
  assert.equal(normalizeThemeMode(undefined), null);
});

test("resolveThemeMode prefers saved theme before system preference", () => {
  assert.equal(resolveThemeMode("dark", false), "dark");
  assert.equal(resolveThemeMode("light", true), "light");
  assert.equal(resolveThemeMode(null, true), "dark");
  assert.equal(resolveThemeMode(null, false), "light");
});

test("toggleThemeMode swaps between light and dark", () => {
  assert.equal(toggleThemeMode("light"), "dark");
  assert.equal(toggleThemeMode("dark"), "light");
});

test("createThemeInitScript applies the saved theme", () => {
  assert.equal(runThemeInitScript({ storedTheme: "dark", prefersDark: false }), "dark");
  assert.equal(runThemeInitScript({ storedTheme: "light", prefersDark: true }), "light");
});

test("createThemeInitScript falls back to system preference when nothing is saved", () => {
  assert.equal(runThemeInitScript({ prefersDark: true }), "dark");
  assert.equal(runThemeInitScript({ prefersDark: false }), "light");
});

test("site frame topbar removes notifications settings and avatar in favor of theme toggle", () => {
  const frameSource = readFileSync(join(process.cwd(), "src/components/site/frame.tsx"), "utf8");

  assert.match(frameSource, /ThemeToggleButton/);
  assert.doesNotMatch(frameSource, /aria-label="Notifications"/);
  assert.doesNotMatch(frameSource, /aria-label="Settings"/);
  assert.doesNotMatch(frameSource, /shell-avatar/);
});

test("site frame renders the theme toggle as a fixed dock instead of a topbar action", () => {
  const frameSource = readFileSync(join(process.cwd(), "src/components/site/frame.tsx"), "utf8");

  assert.doesNotMatch(frameSource, /ShellTopBar/);
  assert.doesNotMatch(frameSource, /shell-topbar/);
  assert.match(frameSource, /shell-theme-dock/);
});

test("dark theme surfaces use dedicated shared classes instead of white utility hard-codes in key shared views", () => {
  const filesToCheck = [
    join(process.cwd(), "src/components/site/ui.tsx"),
    join(process.cwd(), "src/components/site/detail-shell.tsx"),
    join(process.cwd(), "src/components/site/frame.tsx"),
    join(process.cwd(), "src/app/resources/resources-client.tsx"),
    join(process.cwd(), "src/app/resources/page.tsx"),
    join(process.cwd(), "src/app/projects/page.tsx"),
    join(process.cwd(), "src/app/archive/page.tsx"),
    join(process.cwd(), "src/app/projects/[slug]/page.tsx"),
    join(process.cwd(), "src/app/resources/[slug]/page.tsx"),
    join(process.cwd(), "src/app/about/page.tsx"),
    join(process.cwd(), "src/app/not-found.tsx"),
  ];

  const blockedTokens = ["bg-white/", "border-white/", "bg-white text-primary"];

  for (const filePath of filesToCheck) {
    const source = readFileSync(filePath, "utf8");
    for (const token of blockedTokens) {
      assert.equal(
        source.includes(token),
        false,
        `expected ${filePath} to avoid hard-coded shared surface token ${token}`,
      );
    }
  }
});
