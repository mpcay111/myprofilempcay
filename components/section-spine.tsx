'use client';

import { Rule } from '@/components/rule';
import { useActiveSection } from '@/components/active-section';

/**
 * The spine — the mono gutter that runs down the left of every section.
 *
 * Two things changed here, and the second is the reason the first was worth
 * doing.
 *
 * THE RULE NOW MEASURES SOMETHING. It used to be a `border-l` on the sticky
 * label block, which is only as tall as its two lines of text — about 60px. So
 * it looked like a spine and reported nothing: a 60px stub floating beside a
 * 3,000px section. It is now a full-height rail on the column itself, which is
 * what makes the position readout below legible as a position.
 *
 * ONLY THE CURRENT SECTION CARRIES THE ACCENT. Every ordinal used to be teal,
 * which put seven accent marks on screen at once, all competing, none of them
 * telling you anything you did not already know. This spends LESS accent than
 * before, not more — scope.tsx documents making and reverting exactly this
 * mistake with eight accent icons, and seven static teal ordinals were the same
 * error in a quieter form. The accent now means "you are here".
 *
 * With no ActiveSectionProvider mounted, `useActiveSection()` is undefined and
 * every ordinal keeps its accent — the appearance this had before. That is the
 * honest fallback: without an observer there is no current section to mark, and
 * silently dropping the accent everywhere would look like a bug.
 */
export function SectionSpine({
  id,
  index,
  title,
}: {
  /** Must match the id on the enclosing <section>, or it can never be current. */
  id: string;
  /** Zero-padded ordinal, e.g. "03". */
  index: string;
  title: string;
}) {
  const context = useActiveSection();

  /**
   * Two states fall back to the old all-accent appearance rather than to a
   * blank one, and the second matters more than it looks.
   *
   * No provider at all (`undefined`) means nothing is tracking position, so
   * there is no "here" to mark. And `activeId === null` means the reader is
   * genuinely between sections — at the top of the page, in the hero — but it
   * is ALSO what a page reports when the observer never fires: a suspended
   * background tab, or a browser without IntersectionObserver. Marking nothing
   * in that case would drain the accent off the entire spine and read as a
   * broken page rather than a degraded one. Falling back to the previous
   * appearance means the worst case is the appearance we already shipped.
   */
  const noCurrent = context === undefined || context.activeId === null;
  const isCurrent = noCurrent || context.activeId === id;
  const total = context?.total ?? 0;

  return (
    /* lg:relative is what the rail's inset-y-0 resolves against, and in a grid
       the column is as tall as the row — so the rail spans the whole section
       rather than just its own content. */
    <div className="lg:relative lg:col-span-2">
      {/* The rail. `lg:block` only: below lg the spine collapses to a single
          horizontal line and a vertical rule would have nothing to run beside.
          Its left-0 and the label block's pl-4 are a coupled pair — move one
          and the labels detach from the rule. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-border lg:block"
      />

      {/* Decorative: the section already has a real <h2>, so reading
          "03 of 07, section Experience" before it just doubles the
          announcement. */}
      <div
        aria-hidden="true"
        className="flex items-baseline gap-3 lg:sticky lg:top-24 lg:block lg:pl-4"
      >
        <span className="label">
          <span className={`transition-colors ${isCurrent ? 'text-accent' : ''}`}>{index}</span>
          {total > 0 && (
            /* The denominator stays subdued in every state: it is the scale on
               the gauge, not the reading. */
            <span> / {String(total).padStart(2, '0')}</span>
          )}
        </span>
        <span className="label lg:mt-3 lg:block">§ {title}</span>
      </div>

      <div className="mt-4 lg:hidden">
        <Rule />
      </div>
    </div>
  );
}
