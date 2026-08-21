import type { ReactNode } from 'react';

/**
 * The spec rail — the site's signature device.
 *
 * A label/value pair set as a real definition list, hairline-divided. It
 * appears in four places (hero, work, expertise credentials, contact) and the
 * whole point is that a reader can track the same shape down the page, so the
 * row padding, the gap under the term, and the divider colour are declared
 * once here rather than re-approximated per section.
 *
 * `framed` closes the list top and bottom. Use it where the rail is a distinct
 * block beside other content (work); leave it open where the rail is the
 * bottom of a column and a closing rule would read as a false floor (hero).
 */
export function SpecList({
  children,
  framed = false,
  className = '',
}: {
  children: ReactNode;
  framed?: boolean;
  className?: string;
}) {
  return (
    <dl
      className={`divide-y divide-border ${
        framed ? 'border-y border-border' : ''
      } ${className}`}
    >
      {children}
    </dl>
  );
}

export function SpecRow({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="py-3.5">
      <dt className="label">{term}</dt>
      {/* Tabular figures: this is the value half of a rail whose whole purpose
          is that a reader can run their eye down a column of them. Prose sets
          proportional figures on body, so the opt-in has to be here.
          slashed-zero comes along for the same reason `.label` takes it:
          this is the half of the row carrying dates and counts, so it is
          the half where 0 and O actually have to be told apart. Setting
          only tabular-nums here gave the term slashed zeros and the value
          plain ones, in the same two-line row. */}
      <dd className="mt-3 text-[0.9375rem] leading-[1.5] text-muted [font-variant-numeric:tabular-nums_slashed-zero]">
        {children}
      </dd>
    </div>
  );
}

/**
 * A hairline-outlined mono token — stack entries, role tags, tool names.
 *
 * Square by design: the only rounded thing on the site is the availability dot.
 * `caps` is off by default because most token text is a proper noun already
 * cased correctly ("Google Apps Script"), and shouting it loses that.
 */
export function Token({
  children,
  caps = false,
}: {
  children: ReactNode;
  caps?: boolean;
}) {
  /* Optically centred, not mathematically. `.label` sets `leading-none`, so the
     box is the cap height and the space below the baseline that would balance
     it is not there — an even `py-1` therefore sits the text visibly low in its
     own outline. 5px over 3px puts the glyphs where the eye expects them. */
  return (
    <span className={`label border border-border px-2 pb-[3px] pt-[5px] ${caps ? '' : 'normal-case'}`}>
      {children}
    </span>
  );
}
