'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { ThemeSetting } from '@/lib/content/schema';
import {
  THEME_CYCLE,
  THEME_LABELS,
  applyTheme,
  readStoredTheme,
  storeTheme,
} from '@/lib/theme';

const ICONS: Record<ThemeSetting, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

/**
 * Cycles Match device → Light → Dark.
 *
 * Three states rather than two because "match device" is a real preference,
 * not the absence of one — a visitor who keeps their laptop on a schedule
 * should not have to re-pick every time it flips.
 *
 * The icon only renders once mounted. The server cannot know what is in the
 * visitor's localStorage, so rendering an icon during SSR would either be
 * wrong for anyone who has chosen an override, or force a hydration mismatch.
 * The button keeps its full size throughout, so nothing shifts when the icon
 * appears — this is a deliberate trade of one frame of blankness against a
 * layout jump on every page load.
 */
export function ThemeToggle({
  siteDefault,
  className = '',
}: {
  siteDefault: ThemeSetting;
  className?: string;
}) {
  const [setting, setSetting] = useState<ThemeSetting>(siteDefault);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSetting(readStoredTheme(siteDefault));
    setMounted(true);
  }, [siteDefault]);

  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(setting) + 1) % THEME_CYCLE.length];
  const Icon = ICONS[setting];

  function toggle() {
    setSetting(next);
    storeTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      // The label names the destination, not the current state: a control
      // should say what it does. The current state is announced separately.
      aria-label={`Theme: ${THEME_LABELS[setting]}. Switch to ${THEME_LABELS[next].toLowerCase()}.`}
      title={`Theme: ${THEME_LABELS[setting]}`}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center border border-transparent text-subtle transition-colors hover:border-border hover:text-foreground focus-visible:border-accent focus-visible:text-accent ${className}`}
    >
      {mounted ? <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} /> : null}
      <span className="sr-only" aria-live="polite">
        {mounted ? `Theme: ${THEME_LABELS[setting]}` : ''}
      </span>
    </button>
  );
}
