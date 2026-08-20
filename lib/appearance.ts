/**
 * Curated appearance options.
 *
 * Deliberately a fixed set rather than free pickers. Every accent below was
 * chosen by searching its hue for a lightness that clears a comfortable
 * contrast margin against BOTH grounds — the warm paper (#FAF8F5) and the dark
 * ink (#101519) — because the accent is used on 11px labels, and a colour that
 * reads on paper can be unreadable on ink. Each light value also clears 4.5:1
 * for white text sitting on it, which is what ::selection does.
 *
 * Measured ratios are recorded against each entry. If you add one, run the
 * numbers rather than eyeballing it — every value here passes, and that is a
 * property worth keeping.
 */

export type AccentName =
  | 'teal'
  | 'indigo'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'green'
  | 'blue'
  | 'slate';

export type AccentDefinition = {
  label: string;
  /** HSL triples, matching the custom-property format in globals.css. */
  light: string;
  dark: string;
  /** Contrast of accent text on each ground, for the record. */
  ratios: { light: number; dark: number; onAccent: number };
};

export const ACCENTS: Record<AccentName, AccentDefinition> = {
  teal: {
    label: 'Teal',
    light: '176 78% 23%',
    dark: '176 78% 43%',
    ratios: { light: 6.21, dark: 8.36, onAccent: 6.58 },
  },
  indigo: {
    label: 'Indigo',
    light: '243 52% 54%',
    dark: '243 52% 77%',
    ratios: { light: 6.11, dark: 8.08, onAccent: 6.48 },
  },
  violet: {
    label: 'Violet',
    light: '276 45% 46%',
    dark: '276 45% 74%',
    ratios: { light: 6.11, dark: 8.12, onAccent: 6.48 },
  },
  amber: {
    label: 'Amber',
    light: '30 80% 31%',
    dark: '30 80% 60%',
    ratios: { light: 6.03, dark: 8.02, onAccent: 6.4 },
  },
  rose: {
    label: 'Rose',
    light: '345 62% 42%',
    dark: '345 62% 75%',
    ratios: { light: 6.19, dark: 8.27, onAccent: 6.56 },
  },
  green: {
    label: 'Green',
    light: '150 55% 27%',
    dark: '150 55% 49%',
    ratios: { light: 6.12, dark: 8.01, onAccent: 6.49 },
  },
  blue: {
    label: 'Blue',
    light: '212 68% 39%',
    dark: '212 68% 70%',
    ratios: { light: 6.09, dark: 8.03, onAccent: 6.45 },
  },
  slate: {
    label: 'Slate',
    light: '214 20% 38%',
    dark: '214 20% 69%',
    ratios: { light: 6.22, dark: 8.13, onAccent: 6.59 },
  },
};

/* ── Type ───────────────────────────────────────────────────────────────── */

export type SansName = 'inter' | 'source' | 'plex';
export type MonoName = 'jetbrains' | 'plex';

export const SANS_LABELS: Record<SansName, string> = {
  inter: 'Inter — neutral, the default',
  source: 'Source Sans 3 — warmer, slightly humanist',
  plex: 'IBM Plex Sans — more technical, squarer',
};

export const MONO_LABELS: Record<MonoName, string> = {
  jetbrains: 'JetBrains Mono — the default',
  plex: 'IBM Plex Mono — narrower, more typewriter',
};

/**
 * The CSS custom properties that theme the site, as a plain string.
 *
 * Emitted into a <style> tag in the document head, after globals.css, so these
 * win on cascade order without needing !important. The dark values live in
 * their own blocks mirroring globals.css exactly — the same three selectors,
 * so an explicit choice still beats the OS preference.
 */
export function appearanceStyles(accent: AccentName): string {
  const { light, dark } = ACCENTS[accent] ?? ACCENTS.teal;

  return [
    `:root{--accent:${light};}`,
    `@media (prefers-color-scheme:dark){:root:not(.light){--accent:${dark};}}`,
    `.dark{--accent:${dark};}`,
  ].join('');
}
