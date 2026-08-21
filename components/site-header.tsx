'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { SectionConfig, ThemeSetting } from '@/lib/content/schema';
import { ThemeToggle } from '@/components/theme-toggle';
import { useActiveSection } from '@/components/active-section';

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
  servicesLabel = null,
}: {
  name: string;
  credentials: string | null;
  /** Already filtered to visible ones, in page order. */
  sections: SectionConfig[];
  /** Only the default; the visitor's own choice overrides it client-side. */
  themeDefault: ThemeSetting;
  /**
   * Label for the /services link, or null to omit it. Null both hides the link
   * and 404s the route — see app/services/page.tsx.
   */
  servicesLabel?: string | null;
}) {
  /* Shared with the section spine rather than observed again here. See the note
     in active-section.tsx: two observers computing "current" independently is a
     promise that the menu and the spine will eventually disagree on screen. */
  const activeId = useActiveSection()?.activeId ?? null;

  /**
   * The section links are in-page anchors, which stop working the moment this
   * bar is rendered on any page that is not the one-pager: "#experience" on
   * /services points at nothing. Off the home page they become "/#experience"
   * — a real navigation back to the page that owns those sections.
   */
  const pathname = usePathname();
  const onHome = pathname === '/';
  const sectionHref = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const servicesRef = useRef<HTMLAnchorElement | null>(null);

  /* The observer that used to live here now lives in
     ActiveSectionProvider, which feeds both this bar and the section spine. */

  /**
   * The current destination, whichever kind it is.
   *
   * On the home page that is whichever section the observer has marked; on
   * /services it is the Services link, where activeId is null by design. Both
   * the travelling register mark and the mobile centring below read this, so
   * they can never disagree about what "current" means.
   */
  const currentItem = () =>
    onHome ? (activeId ? itemRefs.current[activeId] : null) : servicesRef.current;

  /**
   * Identity of the current destination — not the active section id.
   *
   * Off the home page the destination is always the Services link, however far
   * down the page the reader has scrolled. Keying the effects below on
   * `activeId` instead meant they re-fired at every service boundary, because
   * /services now feeds the provider its own article ids. The visible symptom
   * was the worst kind: the nav is a horizontal scroller at 375px, so each
   * re-fire smooth-scrolled it back to centre the Services link and threw away
   * whatever the reader had swiped it to — once per service, seven times on
   * the current content, with the destination never actually changing.
   */
  const currentKey = onHome ? activeId : 'services';

  /**
   * The register mark — a rule under the current destination that travels
   * between them.
   *
   * Colour alone was carrying this state: white/80 to white, a 4.85:1 to 6.58:1
   * shift on the same glyphs, which is close to invisible as a signal and
   * unavailable to anyone who cannot separate those two whites.
   *
   * It hangs off <nav>, never off the <ul>. <nav> is the scroll container, so
   * an absolutely positioned child scrolls WITH the items at 375px instead of
   * floating over them — and <ul> is deliberately left unpositioned so it never
   * becomes the offsetParent that offsetLeft is measured against.
   */
  const [mark, setMark] = useState<{ left: number; width: number } | null>(null);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    const item = currentItem();

    // Render nothing rather than parking a zero-width bar at the left edge.
    if (!nav || !item) {
      setMark(null);
      setPlaced(false);
      return;
    }

    // offsetLeft, not getBoundingClientRect().left — the rect is viewport-based
    // and would drift by the scroll offset the moment the nav is scrolled.
    const measure = () => setMark({ left: item.offsetLeft, width: item.offsetWidth });
    measure();

    /* Labels are editable in the admin and the webfont swaps in after first
       paint, so a measurement taken once is a measurement that goes stale. */
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    observer.observe(item);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, onHome, pathname, sections, servicesLabel]);

  /**
   * The flag gates the TRANSITION, not the visibility.
   *
   * The mark is painted as soon as it has a position; what waits for a frame is
   * permission to animate. Without that wait the very first mark would slide in
   * from x:0 w:0, which reads as a glitch rather than an entrance — but gating
   * opacity on the frame instead meant the mark was invisible until
   * requestAnimationFrame ran, and rAF does not run in a background tab. A page
   * restored from one would have shown no mark at all. Now the worst case is a
   * mark that appears without animating.
   */
  useEffect(() => {
    if (!mark || placed) return;
    const frame = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(frame);
  }, [mark, placed]);

  /* Below md the nav is a one-line horizontal scroller, so the active
   * destination can sit off-screen. Scrolling the container directly (rather
   * than scrollIntoView) keeps the page itself out of it. */
  useEffect(() => {
    const nav = navRef.current;
    const item = currentItem();

    if (!nav || !item) return;
    if (nav.scrollWidth <= nav.clientWidth) return;

    const left = item.offsetLeft - (nav.clientWidth - item.offsetWidth) / 2;

    nav.scrollTo({
      left: Math.max(0, left),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, [currentKey, onHome, pathname]);

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
    /* The bottom hairline is the boundary the bar never had. A solid block
       ending in nothing reads as an unfinished edge; one line of the same hue,
       a step lighter, resolves it — the same hairline vocabulary the rest of
       the site uses, in the one place that was missing it. Purely decorative,
       so it carries no contrast obligation. */
    <header className="sticky top-0 z-50 h-14 border-b border-accent-bar-edge bg-accent-bar">

      {/* h-full, not a second h-14: preflight puts every box on border-box, so
          the header's own h-14 now includes the 1px edge and its content box is
          55px. A nested h-14 would overflow it by exactly that pixel and push
          the row off-centre. The bar's outer height is still 56px, which is
          what scroll-margin-top and the observer's rootMargin are measured
          against. */}
      <div className="container-grid relative flex h-full items-center justify-between gap-4 sm:gap-8">
        <a href={onHome ? '#top' : '/'} className="flex shrink-0 items-baseline gap-2">
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
          /* "Main", not "Sections": it stopped being only sections when the
             Services page link joined it. Screen readers already announce the
             role, so the label must not repeat the word "navigation". */
          aria-label="Main"
          className="relative -my-1 min-w-0 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul role="list" className="flex items-center gap-5">
            {sections.map((item) => {
              const isActive = item.id === activeId;

              return (
                <li key={item.id} className="shrink-0">
                  <a
                    href={sectionHref(item.id)}
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

            {/* A page, not a section — so it gets `aria-current="page"` rather
                than "location", and a hairline in front of it at sm+ to mark
                that it leaves this document rather than scrolling within it. */}
            {servicesLabel && (
              <li className="shrink-0 sm:border-l sm:border-white/25 sm:pl-5">
                <a
                  href="/services"
                  ref={servicesRef}
                  aria-current={pathname === '/services' ? 'page' : undefined}
                  className={`label block whitespace-nowrap py-2 transition-colors ${
                    pathname === '/services'
                      ? 'text-white'
                      : 'text-white/80 hover:text-white focus-visible:text-white'
                  }`}
                >
                  {servicesLabel}
                </a>
              </li>
            )}
          </ul>

          {/* Decorative: aria-current on the link already states which
              destination is current, and announcing a rule would only repeat
              it. The transition is applied only once placed, so the first
              appearance cannot slide in from the left edge; the reduced-motion
              block in globals.css zeroes it for anyone who asked. */}
          {mark && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-1 h-0.5 bg-white ${
                placed
                  ? 'transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
                  : ''
              }`}
              style={{ left: mark.left, width: mark.width }}
            />
          )}
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
