'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Which section the reader is currently in.
 *
 * There used to be one of these inside SiteHeader, observing the same elements
 * with the same rootMargin for the sole purpose of marking a menu item. The
 * spine needs exactly the same answer, and two observers computing "current"
 * independently is a promise that they will eventually disagree — the menu
 * would highlight one section while the spine highlighted another, on the same
 * screen, and nothing about that would be debuggable from the markup.
 *
 * `undefined` means no provider is mounted at all, which is different from
 * "there is no current section". Consumers use that to fall back to their
 * pre-existing static appearance rather than rendering an empty state.
 */
type ActiveSection = {
  /** The id currently in the observation band, or null if none is. */
  activeId: string | null;
  /** How many are being observed — the denominator of the spine's gauge. */
  total: number;
};

const ActiveSectionContext = createContext<ActiveSection | undefined>(undefined);

/**
 * Returns undefined when no provider is mounted. The count travels with the id
 * so the spine can render "03 / 07" without every section component having to
 * accept and forward a `total` prop it does not otherwise care about.
 */
export function useActiveSection() {
  return useContext(ActiveSectionContext);
}

export function ActiveSectionProvider({
  ids,
  children,
}: {
  /** Element ids to observe, in document order. */
  ids: string[];
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  /* The array is rebuilt on every render by the server component above, so it
     is never referentially stable. Keying the effect on the contents rather
     than the identity stops the observer being torn down and rebuilt for no
     reason on every render. */
  const key = ids.join('|');

  useEffect(() => {
    const observedIds = key === '' ? [] : key.split('|');

    /* getElementById can miss: the section list is editable at runtime, so an
       id may name a section that is not on this page. Those simply never
       activate. */
    const elements = observedIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      setActiveId(null);
      return;
    }

    const intersecting = new Set<string>();

    /* The observation band is the top ~40% of the viewport, below the 56px
       bar. A section counts as current while it still occupies that band, and
       the first in document order wins — so the mark advances when the previous
       section has genuinely left, not the moment the next one peeks in. */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        }

        const current = observedIds.find((id) => intersecting.has(id));
        setActiveId(current ?? null);
      },
      { rootMargin: '-56px 0px -60% 0px' },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [key]);

  /**
   * `total` counts the ids passed in, NOT the elements the observer found.
   *
   * That is deliberate and it constrains the caller: this value is rendered on
   * the server, and counting DOM elements would make it 0 during SSR and N
   * after hydration — a mismatch, and a gauge that visibly changes denominator
   * on load. So the contract is that `ids` must name sections that actually
   * render. `visibleSections()` is where that is enforced; it filters the video
   * section on whether a video will genuinely embed rather than on the list
   * being non-empty, because the looser test used to leave an id here for a
   * section that rendered nothing — and this denominator was then one too high
   * on every spine on the page.
   */
  const value = useMemo(
    () => ({ activeId, total: key === '' ? 0 : key.split('|').length }),
    [activeId, key],
  );

  return (
    <ActiveSectionContext.Provider value={value}>{children}</ActiveSectionContext.Provider>
  );
}
