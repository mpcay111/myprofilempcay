'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { LogoItem } from '@/lib/content/schema';

/**
 * The logo bar under the header.
 *
 * COLOUR. Logos render as monochrome silhouettes via `--logo-filter`:
 * `brightness(0)` flattens any artwork to solid black, and the dark palette
 * swaps in `invert(1)` to make it solid white. That is not only stylistic —
 * this site has two grounds, and a dark logo uploaded once would be invisible
 * on the dark one. A silhouette reads on both without the owner supplying two
 * files. Hovering restores the real colours for the one being looked at.
 *
 * The filter is a custom property rather than Tailwind's `dark:` variant on
 * purpose. This site has THREE theme states, and the commonest — "follow the
 * device", which sets no class at all — is matched by a prefers-color-scheme
 * media query, not by `.dark`. A `dark:` variant would have left the logos
 * black on the dark ground for exactly the visitors this treatment protects.
 *
 * This requires artwork with a transparent background — a logo on a white
 * rectangle flattens to a black rectangle. The admin says so.
 *
 * The filter is deliberately NOT transitioned. CSS interpolates filter lists
 * function by function, and switching theme swaps `invert(0)` for `invert(1)`
 * mid-flight: measured live, the logos lagged a full toggle behind the page and
 * sat at values like `invert(0.995)` long after the transition should have
 * ended — black logos on the dark ground, which is the exact failure this
 * treatment exists to prevent. The colour swap is instant now; the wrapper's
 * opacity transition still carries the hover.
 *
 * MOTION. WCAG 2.2.2 requires a way to stop content that moves by itself for
 * more than five seconds. Hover-pause alone does not satisfy it — a keyboard or
 * touch user has no hover — so there is a real pause button, always present in
 * the accessibility tree. The animation is additionally gated behind
 * `motion-safe`, so anyone who has asked their system for reduced motion gets a
 * still bar and never has to press anything.
 *
 * The set is rendered twice so the loop is seamless. The second copy is
 * `aria-hidden`, so assistive technology reads the list once rather than twice.
 */

function LogoImage({ logo }: { logo: LogoItem }) {
  if (!logo.image) return null;

  /* A plain <img>, not next/image. These are small, arbitrarily-sized logos
     rendered at a fixed height; the optimiser would add a per-logo transform
     for no gain, and `fill` needs a sized box that a variable-width logo does
     not have. */
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.image}
      alt={logo.name}
      loading="lazy"
      className="h-7 w-auto max-w-[9rem] object-contain [filter:var(--logo-filter)] group-hover/logo:[filter:none] sm:h-8"
    />
  );

  if (logo.url) {
    return (
      <a
        href={logo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/logo flex shrink-0 items-center opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        title={logo.name}
      >
        {image}
      </a>
    );
  }

  return (
    <span className="group/logo flex shrink-0 items-center opacity-60 transition-opacity hover:opacity-100">
      {image}
    </span>
  );
}

export function LogoMarquee({ logos }: { logos: LogoItem[] }) {
  const [paused, setPaused] = useState(false);

  const usable = logos.filter((l) => l.image);
  if (usable.length === 0) return null;

  /* Duration scales with the number of logos so the speed per logo stays
     constant — a fixed duration would make two logos crawl and twelve blur. */
  const duration = `${Math.max(18, usable.length * 6)}s`;

  const row = (copy: number) => (
    <ul
      role="list"
      aria-hidden={copy === 1 ? undefined : true}
      className="flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16"
    >
      {usable.map((logo, i) => (
        <li key={`${copy}-${logo.name}-${i}`} className="flex items-center">
          <LogoImage logo={logo} />
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      aria-label="Companies and brands I have worked with"
      className="relative border-b border-border bg-background"
    >
      <div className="group/marquee relative flex h-16 items-center overflow-hidden">
        <div
          className="flex w-max animate-none motion-safe:animate-marquee group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]"
          /* The button's pause is an inline style, not a class. As a class it
             silently did nothing: `animate-marquee` sets the `animation`
             SHORTHAND, which resets animation-play-state to `running`, and
             Tailwind emits it after the arbitrary utility at equal specificity,
             so the later rule won. Measured: the class was on the element and
             the animation kept running. Inline beats stylesheet order outright.
             Left undefined while running so the hover/focus rules still apply. */
          style={{
            animationDuration: duration,
            animationPlayState: paused ? 'paused' : undefined,
          }}
        >
          {row(1)}
          {row(2)}
        </div>

        {/* Fades the logos out at both edges rather than clipping them mid-mark.
            Pointer-events off so it never blocks a logo link. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent sm:w-16"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent sm:w-24"
        />

        {/* WCAG 2.2.2. Subdued until hovered or focused, but always present and
            always reachable by keyboard. */}
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-pressed={paused}
          aria-label={paused ? 'Resume the scrolling logo bar' : 'Pause the scrolling logo bar'}
          className="absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-subtle opacity-0 transition-opacity hover:text-foreground focus-visible:text-foreground focus-visible:opacity-100 group-hover/marquee:opacity-100 motion-reduce:hidden"
        >
          {paused ? (
            <Play className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Pause className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}
