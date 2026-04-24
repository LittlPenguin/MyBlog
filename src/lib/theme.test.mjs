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

test("site frame defines a dedicated mobile navigation shell instead of reusing the desktop sidebar block", () => {
  const frameSource = readFileSync(join(process.cwd(), "src/components/site/frame.tsx"), "utf8");
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  assert.match(frameSource, /function MobileNavigation/);
  assert.match(frameSource, /shell-mobile-nav/);
  assert.match(frameSource, /shell-mobile-nav-toggle/);
  assert.match(frameSource, /shell-mobile-nav-panel/);
  assert.match(frameSource, /shell-mobile-nav-backdrop/);
  assert.match(frameSource, /setMobileNavOpen/);
  assert.match(frameSource, /document\.body\.style\.overflow = "hidden"/);
  assert.match(frameSource, /document\.body\.style\.overflow = ""/);
  assert.match(globalStyles, /\.shell-mobile-nav/);
  assert.match(globalStyles, /\.shell-mobile-nav-bar/);
  assert.match(globalStyles, /\.shell-mobile-nav-toggle/);
  assert.match(globalStyles, /\.shell-mobile-nav-panel/);
  assert.match(globalStyles, /\.shell-mobile-nav-backdrop/);
  assert.match(globalStyles, /\.shell-sidebar,\s*\.loading-sidebar\s*\{\s*display:\s*none;/);
  assert.match(globalStyles, /\.shell-mobile-nav\s*\{\s*display:\s*block;/);
});

test("expanded mobile nav panel uses a near-solid light-theme glass surface for narrow screens", () => {
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  assert.match(
    globalStyles,
    /\.shell-mobile-nav-panel\s*\{[\s\S]*?background:\s*linear-gradient\(\s*180deg,\s*color-mix\(in srgb, var\(--surface-strong\) 100%, transparent\),\s*color-mix\(in srgb, var\(--background-strong\) 98%, transparent\)\s*\)/,
  );
});

test("theme toggle keeps a dedicated breathing animation hook for theme switches", () => {
  const toggleSource = readFileSync(join(process.cwd(), "src/components/site/theme-toggle.tsx"), "utf8");
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  assert.match(toggleSource, /shell-theme-toggle-breathing/);
  assert.match(toggleSource, /setIsBreathing/);
  assert.match(globalStyles, /@keyframes theme-toggle-breathe/);
  assert.match(globalStyles, /\.shell-theme-toggle-breathing/);
});

test("theme-driven color transitions use linear timing to avoid eased color drift", () => {
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  assert.match(globalStyles, /color 280ms linear/);
  assert.match(globalStyles, /color 180ms linear/);
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

test("archive filters use breathing icon triggers that open floating search and category dialogs", () => {
  const archiveClientSource = readFileSync(join(process.cwd(), "src/app/archive/archive-client.tsx"), "utf8");
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  assert.match(archiveClientSource, /archive-toolbar-layer/);
  assert.match(archiveClientSource, /archive-toolbar/);
  assert.match(archiveClientSource, /archive-tool-shell/);
  assert.match(archiveClientSource, /archive-tool-trigger/);
  assert.match(archiveClientSource, /archive-tool-trigger-breathing/);
  assert.match(archiveClientSource, /archive-search-dialog/);
  assert.match(archiveClientSource, /archive-filter-dialog/);
  assert.match(archiveClientSource, /archive-dialog-panel/);
  assert.match(archiveClientSource, /archive-filter-indicator/);
  assert.match(archiveClientSource, /搜索文章/);
  assert.match(archiveClientSource, /分类筛选/);
  assert.match(archiveClientSource, /标题、摘要、标签、分类/);
  assert.match(archiveClientSource, /清除/);
  assert.match(archiveClientSource, /全部分类/);
  assert.doesNotMatch(archiveClientSource, /收起/);
  assert.match(archiveClientSource, /AnimatePresence/);
  assert.match(archiveClientSource, /motion\./);
  assert.match(archiveClientSource, /Search/);
  assert.match(archiveClientSource, /Filter/);
  assert.match(globalStyles, /\.archive-toolbar-layer/);
  assert.match(globalStyles, /\.archive-toolbar/);
  assert.match(globalStyles, /\.archive-tool-shell/);
  assert.match(globalStyles, /\.archive-tool-trigger/);
  assert.match(globalStyles, /\.archive-tool-trigger-breathing/);
  assert.match(globalStyles, /@keyframes archive-tool-breathe/);
  assert.match(globalStyles, /\.archive-dialog-panel/);
  assert.match(globalStyles, /\.archive-search-dialog/);
  assert.match(globalStyles, /\.archive-filter-dialog/);
  assert.match(globalStyles, /z-index:\s*18/);
  assert.match(globalStyles, /z-index:\s*24/);
  assert.match(globalStyles, /height:\s*2\.125rem/);
  assert.match(globalStyles, /width:\s*2\.125rem/);
});

test("archive floating dialogs use denser glass surfaces for readability in both themes", () => {
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  assert.match(
    globalStyles,
    /linear-gradient\(180deg,\s*color-mix\(in srgb, var\(--surface-strong\) 97%, transparent\),\s*color-mix\(in srgb, var\(--surface\) 99%, transparent\)\)/,
  );
  assert.match(globalStyles, /border-color:\s*color-mix\(in srgb, var\(--primary\) 22%, var\(--line\)\)/);
  assert.match(globalStyles, /0 30px 62px rgba\(89, 46, 32, 0\.22\)/);
  assert.match(globalStyles, /inset 0 1px 0 rgba\(255, 255, 255, 0\.82\)/);
  assert.match(globalStyles, /border-color:\s*rgba\(255, 208, 143, 0\.3\)/);
  assert.match(
    globalStyles,
    /linear-gradient\(180deg,\s*rgba\(24, 31, 39, 0\.992\),\s*rgba\(18, 24, 31, 0\.972\)\)/,
  );
  assert.match(globalStyles, /0 30px 66px rgba\(0, 0, 0, 0\.46\)/);
  assert.match(globalStyles, /inset 0 1px 0 rgba\(255, 255, 255, 0\.1\)/);
});

test("archive dialogs close only on outside pointer interactions", () => {
  const archiveClientSource = readFileSync(join(process.cwd(), "src/app/archive/archive-client.tsx"), "utf8");

  assert.match(archiveClientSource, /window\.addEventListener\("pointerdown", handlePointerDown\)/);
  assert.match(archiveClientSource, /setOpenPanel\(null\);/);
  assert.doesNotMatch(archiveClientSource, /onBlurCapture=/);
  assert.doesNotMatch(archiveClientSource, /handleKeyDown/);
  assert.doesNotMatch(archiveClientSource, /window\.addEventListener\("keydown"/);
  assert.doesNotMatch(archiveClientSource, /archive-dialog-close/);
  assert.doesNotMatch(archiveClientSource, /收起/);
  assert.doesNotMatch(archiveClientSource, /onClick=\{\(\) => setOpenPanel\(null\)\}/);
  assert.doesNotMatch(archiveClientSource, /setCategory\(item\)[\s\S]*setOpenPanel\(null\)/);
});

test("admin delete uses a custom animated confirmation dialog instead of window.confirm", () => {
  const deleteButtonSource = readFileSync(join(process.cwd(), "src/components/site/admin-delete-button.tsx"), "utf8");
  const deleteDialogSource = readFileSync(
    join(process.cwd(), "src/components/site/delete-confirm-dialog.tsx"),
    "utf8",
  );
  const globalStyles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  assert.doesNotMatch(deleteButtonSource, /window\.confirm/);
  assert.match(deleteButtonSource, /DeleteConfirmDialog/);
  assert.match(deleteDialogSource, /AnimatePresence/);
  assert.match(deleteDialogSource, /motion\./);
  assert.match(deleteDialogSource, /createPortal/);
  assert.match(deleteButtonSource, /DeleteConfirmDialog/);
  assert.match(deleteDialogSource, /admin-delete-dialog-overlay/);
  assert.match(deleteDialogSource, /admin-delete-dialog-shell/);
  assert.match(deleteDialogSource, /admin-delete-dialog-stage/);
  assert.match(deleteDialogSource, /admin-delete-dialog-panel/);
  assert.match(deleteDialogSource, /admin-delete-dialog-body/);
  assert.match(deleteDialogSource, /admin-delete-dialog-warning/);
  assert.match(deleteDialogSource, /admin-delete-dialog-cancel/);
  assert.match(deleteDialogSource, /admin-delete-dialog-confirm/);
  assert.match(deleteDialogSource, /取消/);
  assert.match(deleteDialogSource, /确认删除/);
  assert.doesNotMatch(deleteButtonSource, /message && !isOpen/);
  assert.match(globalStyles, /@keyframes admin-delete-breathe/);
  assert.match(globalStyles, /@keyframes admin-delete-pop-in/);
  assert.match(globalStyles, /@keyframes admin-delete-panel-bob/);
  assert.match(globalStyles, /\.admin-delete-dialog-overlay/);
  assert.match(globalStyles, /\.admin-delete-dialog-shell/);
  assert.match(globalStyles, /\.admin-delete-dialog-stage/);
  assert.match(globalStyles, /\.admin-delete-dialog-panel/);
  assert.match(globalStyles, /\.admin-delete-dialog-body/);
  assert.match(globalStyles, /\.admin-delete-dialog-warning/);
  assert.match(globalStyles, /\.admin-delete-dialog-confirm/);
  assert.match(globalStyles, /min-height:\s*22rem/);
  assert.match(globalStyles, /width:\s*min\(34rem, calc\(100vw - 2rem\)\)/);
  assert.match(globalStyles, /position:\s*fixed/);
  assert.match(globalStyles, /place-items:\s*center/);
});
