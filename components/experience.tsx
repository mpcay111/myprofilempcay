'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Reveal } from '@/components/reveal';
import { Rule } from '@/components/rule';
import { Copy } from '@/components/placeholder-text';
import { isPlaceholder, realOnly } from '@/lib/placeholder';
import { Section } from '@/components/section';
import { Token } from '@/components/spec';
import type { ExperienceEntry } from '@/lib/content/schema';

/**
 * Twenty-seven highlight bullets across four roles is more than anyone reads.
 *
 * This section discloses rather than columns them: each role opens with its
 * summary and a few leading highlights, and the rest sit behind a real
 * <button>. Two columns at lg would only have thinned the desktop view, and the
 * desktop view was never the problem — the 375px column is where 27 stacked
 * bullets actually bury the page. Disclosure fixes both widths at once, and it
 * lets the current role open wider than the historical ones, which is the
 * hierarchy the page wants anyway.
 *
 * The overflow bullets stay in the DOM and are hidden with the `hidden`
 * attribute rather than dropped from the tree, so find-in-page, print and
 * crawlers still see the full record.
 */

/** How many highlights are visible before the disclosure. Recency gets more. */
const INITIAL_CURRENT = 5;
const INITIAL_HISTORICAL = 3;

const MONTH_INDEX: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

/** "Oct 2025" → "2025-10". Returns null for anything that is not a month-year. */
function toMachineDate(value: string): string | null {
  const match = /^([A-Za-z]{3})[a-z]*\s+(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = MONTH_INDEX[match[1].toLowerCase()];
  return month ? `${match[2]}-${month}` : null;
}

function DateValue({ value }: { value: string }) {
  const machine = toMachineDate(value);
  if (!machine) return <span>{value}</span>;
  return <time dateTime={machine}>{value}</time>;
}

function Entry({ entry, current }: { entry: ExperienceEntry; current: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  const initial = current ? INITIAL_CURRENT : INITIAL_HISTORICAL;

  /**
   * A bracketed note is a question addressed to the site's owner. Burying one
   * behind a collapsed control is how it never gets answered, so placeholders
   * are always in the opening set regardless of where they fall in the list.
   */
  const opensVisible = (highlight: string, i: number) => i < initial || isPlaceholder(highlight);
  const concealed = entry.highlights.filter((h, i) => !opensVisible(h, i)).length;

  const tags = realOnly(entry.tags);

  return (
    <article className="grid gap-y-6 pb-14 pt-8 md:grid-cols-12 md:gap-x-8 md:pb-20 md:pt-10">
      {/* Spec rail — the mono register, aligned down the whole section. */}
      <div className="md:col-span-3">
        <p className="label flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <DateValue value={entry.start} />
          <span aria-hidden="true">–</span>
          <span className="sr-only">to</span>
          {current ? (
            <span className="text-accent">{entry.end}</span>
          ) : (
            <DateValue value={entry.end} />
          )}
        </p>
        {entry.location && (
          <p className="mt-2.5 font-mono text-xs leading-snug text-subtle">{entry.location}</p>
        )}
      </div>

      <div className="md:col-span-9">
        <h3
          className={
            current
              ? 'text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-[1.75rem]'
              : 'text-xl font-semibold leading-tight tracking-[-0.02em]'
          }
        >
          {entry.company}
        </h3>
        <p className="mt-2 text-[0.9375rem] font-medium text-muted md:text-base">{entry.title}</p>

        <p
          className={
            current
              ? 'mt-5 max-w-prose text-[1.0625rem] leading-[1.6] text-foreground'
              : 'mt-4 max-w-prose text-[0.9375rem] leading-[1.6] text-muted md:text-base'
          }
        >
          <Copy>{entry.summary}</Copy>
        </p>

        <ul id={listId} role="list" className="mt-7 max-w-prose space-y-3">
          {entry.highlights.map((highlight, i) => (
            <li
              key={highlight}
              hidden={!expanded && !opensVisible(highlight, i)}
              className="relative pl-6 text-[0.9375rem] leading-[1.55] text-muted before:absolute before:left-0 before:top-[0.7em] before:h-px before:w-3 before:bg-border-strong before:content-['']"
            >
              <Copy>{highlight}</Copy>
            </li>
          ))}
        </ul>

        {concealed > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls={listId}
            className="label mt-6 inline-flex items-center gap-2 text-foreground transition-colors hover:text-accent focus-visible:text-accent"
          >
            {expanded ? 'Show fewer' : `Show all ${entry.highlights.length}`}
            <ChevronDown
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}

        {tags.length > 0 && (
          <ul role="list" className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              /* The li is the flex item so the token's padding and hairline are
                 measured by layout rather than overflowing an inline box. */
              <li key={tag} className="flex">
                <Token caps>{tag}</Token>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/**
 * Takes only the entries, NOT the whole content document — this is a client
 * component, and every prop it receives is serialised into the page HTML where
 * anyone can read it. See the note in site-header.tsx.
 */
export function Experience({ entries }: { entries: ExperienceEntry[] }) {
  /* The standfirst states no year count on purpose. The hero derives that
   * figure from the clock; a second, hardcoded copy here would drift out of
   * agreement with it. The dated timeline below carries the span instead. */
  return (
    <Section
      id="experience"
      index="02"
      title="Experience"
      standfirst="One arc through e-commerce operations — front-line agent in 2013, director of operations in 2025. Four employers, each a wider span of control than the last."
    >
      <ol role="list">
        {entries.map((entry, i) => (
          <Reveal as="li" key={entry.company} delay={i * 0.06}>
            <Rule />
            <Entry entry={entry} current={entry.end === 'Present'} />
          </Reveal>
        ))}
      </ol>
      <Rule />
    </Section>
  );
}
