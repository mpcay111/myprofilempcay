import { isPlaceholder } from '@/lib/placeholder';

/**
 * Renders a content string, marking it if it is still an unfilled placeholder.
 *
 * Used for prose. For the spec rail — where an unfilled value is better shown
 * as an absence than as a sentence — use `SpecValue` instead.
 */
export function Copy({ children }: { children: string }) {
  if (!isPlaceholder(children)) return <>{children}</>;
  return (
    <span className="ph" title="Placeholder — fill this in at content/profile.ts">
      {children}
    </span>
  );
}

/**
 * A spec-rail value. Nulls and unfilled placeholders both collapse to an em
 * dash: in a column of hard specifics, a missing value reads more honestly as
 * blank than as a bracketed note.
 */
export function SpecValue({ value }: { value: string | null | undefined }) {
  if (isPlaceholder(value)) {
    // A bare <span> has ARIA role `generic`, which is name-prohibited — an
    // aria-label on it is silently dropped by every major engine. The em dash
    // is hidden and the meaning carried by real text instead.
    return (
      <>
        <span className="text-subtle" aria-hidden="true">
          —
        </span>
        <span className="sr-only">Not specified</span>
      </>
    );
  }
  return <>{value}</>;
}
