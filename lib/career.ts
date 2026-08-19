/**
 * Whole years elapsed since the career start, month-aware.
 *
 * The month matters. Subtracting bare years overstates by up to a full year
 * every January: on 1 Jan 2026 a year-only calculation claimed 13 years when
 * the true elapsed span was 12.
 *
 * Takes the start date as arguments rather than importing it, because the
 * career start is now editable content that arrives at runtime rather than a
 * compile-time constant.
 *
 * Call from server components only — it reads the clock, so evaluating it
 * during a client render could let server and client disagree across a
 * midnight or new-year boundary and produce a hydration mismatch.
 */
export function yearsOfExperience(
  startYear: number,
  startMonth: number,
  now: Date = new Date(),
): number {
  const months = (now.getFullYear() - startYear) * 12 + (now.getMonth() + 1 - startMonth);
  return Math.max(0, Math.floor(months / 12));
}
