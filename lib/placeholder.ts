/**
 * Helpers for detecting the [bracketed] placeholder values in content/profile.ts.
 *
 * Placeholders still render on the page — you need to see them to know what to
 * replace — but they are stripped from machine-readable output (JSON-LD, meta
 * tags) so a half-finished site never publishes "[Your Name]" to Google.
 */

/** True when a value is an unfilled placeholder like "[Your Name]". */
export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value) return true;
  return /\[.+\]/.test(value);
}

/** Returns the value, or `fallback` when it is still a placeholder. */
export function orFallback(value: string | null | undefined, fallback: string): string {
  return isPlaceholder(value) ? fallback : (value as string);
}

/** Returns the value, or null when it is still a placeholder. */
export function orNull(value: string | null | undefined): string | null {
  return isPlaceholder(value) ? null : (value as string);
}

/** Drops any entries that are still placeholders. */
export function realOnly(values: readonly string[]): string[] {
  return values.filter((v) => !isPlaceholder(v));
}

const SMALL_NUMBERS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
];

/**
 * Spells out a small count for use in prose.
 *
 * Counts on this site are derived from the content arrays rather than typed
 * out, so they stay true when a project is added — but a sentence should not
 * open with a digit. Above twelve the numeral is the more readable form
 * anyway, which is where this stops.
 */
export function spellOut(n: number): string {
  return SMALL_NUMBERS[n] ?? String(n);
}
