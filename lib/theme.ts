import type { ThemeSetting } from '@/lib/content/schema';

/**
 * Theme resolution, shared by the inline boot script and the toggle.
 *
 * Precedence, highest first:
 *   1. The visitor's own choice, in localStorage on their device.
 *   2. The site default, set in the admin.
 *   3. 'system', which defers to prefers-color-scheme in CSS.
 *
 * The class is applied to <html>. globals.css does the rest: `:root` carries
 * the light palette, `.dark` the dark one, and a prefers-color-scheme block
 * guarded by `:not(.light)` covers the 'system' case — so 'system' is the
 * ABSENCE of a class, never a class of its own.
 */

export const THEME_STORAGE_KEY = 'mpc-theme';
export const THEME_CLASSES = ['light', 'dark'] as const;

/** The order the header toggle cycles through. */
export const THEME_CYCLE: ThemeSetting[] = ['system', 'light', 'dark'];

export const THEME_LABELS: Record<ThemeSetting, string> = {
  system: 'Match device',
  light: 'Light',
  dark: 'Dark',
};

/**
 * The script that runs before first paint.
 *
 * This has to be inline and synchronous in <head>. Anything deferred — a
 * useEffect, a module import, even a `defer` script — runs after the browser
 * has already painted, so a visitor who chose dark would see a white flash on
 * every navigation. That flash is the entire reason this exists.
 *
 * Written as a string rather than a function so it can be inlined verbatim
 * without a bundler wrapping it in module scaffolding.
 */
export function themeBootScript(siteDefault: ThemeSetting): string {
  return `(function(){try{
var d=${JSON.stringify(siteDefault)};
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var c=(s==='light'||s==='dark'||s==='system')?s:d;
var e=document.documentElement;
e.classList.remove('light','dark');
if(c==='light'||c==='dark')e.classList.add(c);
}catch(_){}})();`;
}

/** Applies a setting to the document. Client-side only. */
export function applyTheme(setting: ThemeSetting): void {
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES);
  if (setting === 'light' || setting === 'dark') root.classList.add(setting);
}

/** Reads the visitor's stored choice, falling back to the site default. */
export function readStoredTheme(siteDefault: ThemeSetting): ThemeSetting {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Private browsing or blocked storage — fall through to the default.
  }
  return siteDefault;
}

export function storeTheme(setting: ThemeSetting): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, setting);
  } catch {
    // Not fatal: the theme still applies for this page view.
  }
}
