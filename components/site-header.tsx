'use client';

import { useEffect, useRef, useState } from 'react';
import type { SectionConfig, ThemeSetting } from '@/lib/content/schema';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * The sticky bar. 56px, fixed forever — `section[id] { scroll-margin-top: 5rem }`
 * in globals.css is measured against this height, so changing it here silently
 * misaligns every anchor on the site.
 *
 * Over the hero the bar is invisible: no ground, no hairline, just the words
 * floating on the paper. It only materialises once you have left the top, which
 * is the point at which it stops being decoration and starts being navigation.
 */
/**
 * Takes only the four values it renders, NOT the whole content document.
 *
 * This is a client component, so every prop is serialised into the RSC payload
 * embedded in the page HTML — readable by anyone who views source. Handing it
 * the whole document would publish the private phone number on a page that
 * deliberately does not display it. Client components get narrow props here
 * for that reason; server components can take the document whole.
 */
export function SiteHeader({
  name,
  credentials,
  sections,
  themeDefault,
}: {
  name: string;
  credentials: string | null;
  /** Already filtered to visible ones, in page order. */
  sections: SectionConfig[];
  /** Only the default; the visitor's own choice overrides it client-side. */
  themeDefault: ThemeSetting;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  /* The observation band is the top ~40% of the viewport, below the bar. A
   * section counts as "current" while it still occupies that band, and the
   * first one in document order wins — so the mark advances when the previous
   * section has genuinely left, not the moment the next one peeks in.
   *
   * getElementById can miss: the section list is editable at runtime, so an id may
   * name a section that is not on the page. Those entries are filtered out and
   * simply never activate. */
  useEffect(() => {
    const observed = sections
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (observed.length === 0) return;

    const intersecting = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        }

        const current = sections.find((item) => intersecting.has(item.id));
        setActiveId(current ? current.id : null);
      },
      { rootMargin: '-56px 0px -60% 0px' },
    );

    for (const element of observed) observer.observe(element);
    return () => observer.disconnect();
  }, [sections]);

  /* Below md the nav is a one-line horizontal scroller, so the active
   * destination can sit off-screen. Scrolling the container directly (rather
   * than scrollIntoView) keeps the page itself out of it. */
  useEffect(() => {
    const nav = navRef.current;
    const item = activeId ? itemRefs.current[activeId] : null;
    if (!nav || !item) return;
    if (nav.scrollWidth <= nav.clientWidth) return;

    const left = item.offsetLeft - (nav.clientWidth - item.offsetWidth) / 2;

    nav.scrollTo({
      left: Math.max(0, left),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, [activeId]);

  return (
    /* A solid accent bar in both themes. It used to be transparent over the
       hero and fade in a page-coloured ground on scroll; that is gone, because
       a bar that is always there does not need to announce its arrival.

       The ground is --accent-bar rather than --accent: the accent lightens in
       dark mode so it stays legible ON a dark page, which makes it a poor
       ground for white text. --accent-bar holds the deeper tone in both themes,
       and every accent option clears 6.4:1 against white.

       Secondary text is white/80, not the /70 that looks right by eye: over
       this ground /70 measures 4.13:1 and /75 measures 4.49:1, both short of
       the 4.5 these 11px labels need. /80 gives 4.87:1 on teal and 4.73:1 on
       amber, which is the lightest accent and therefore the worst case. */
    <header className="sticky top-0 z-50 h-14 bg-accent-bar">

      <div className="container-grid relative flex h-14 items-center justify-between gap-4 sm:gap-8">
        <a href="#top" className="flex shrink-0 items-baseline gap-2">
          <span className="text-sm font-semibold tracking-[-0.01em] text-white sm:text-[0.9375rem]">
            {name}
          </span>
          {credentials && (
            <span className="label hidden text-white/80 sm:inline">{credentials}</span>
          )}
        </a>

        {/* The nav stays the scroll container and stays `relative`: the
            centring effect measures item.offsetLeft against it. The <ul> is
            deliberately unpositioned so it never becomes the offsetParent and
            never breaks that measurement. */}
        <nav
          ref={navRef}
          aria-label="Sections"
          className="relative -my-1 min-w-0 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul role="list" className="flex items-center gap-5">
            {sections.map((item) => {
              const isActive = item.id === activeId;

              return (
                <li key={item.id} className="shrink-0">
                  <a
                    href={`#${item.id}`}
                    ref={(node) => {
                      itemRefs.current[item.id] = node;
                    }}
                    /* These point at in-page sections, so the specified token
                       is `location` — a bare `true` announces only "current". */
                    aria-current={isActive ? 'location' : undefined}
                    /* .label carries the register and its own text-subtle; the
                       utility below outranks it by layer, so the active colour
                       lands without duplicating the type styles. */
                    className={`label block whitespace-nowrap py-2 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-white/80 hover:text-white focus-visible:text-white'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Outside the nav's scroll container on purpose: inside it, the
            toggle would scroll away with the section links on a narrow
            screen and become unreachable. */}
        <ThemeToggle
          siteDefault={themeDefault}
          className="-mr-1.5 text-white/80 hover:border-white/60 hover:text-white focus-visible:border-white focus-visible:text-white"
        />
      </div>
    </header>
  );
}
