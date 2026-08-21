import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        subtle: 'hsl(var(--subtle) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        'border-strong': 'hsl(var(--border-strong) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
        'accent-bar': 'hsl(var(--accent-bar) / <alpha-value>)',
        /* The lit edge along the bottom of the header bar. Derived from the
           chosen accent in lib/appearance.ts, not written here, so it follows
           whichever accent the admin selects. */
        'accent-bar-edge': 'hsl(var(--accent-bar-edge) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: {
        container: '1280px',
        prose: '62ch',
        narrative: '58ch',
      },
      letterSpacing: {
        label: '0.14em',
      },
      keyframes: {
        /* Translates exactly -50%: the track holds the logo set twice, so at
           the halfway point the second copy sits precisely where the first
           began and the loop is seamless. Any other distance would jump. */
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        /* The entrance for bullets revealed by the experience disclosure. Runs
           with a per-item `animation-delay` set inline, which is exactly why
           the reduced-motion block in globals.css has to zero delays as well as
           durations — `fill-mode: both` would otherwise hold each item at
           opacity 0 for the length of its stagger. */
        'reveal-item': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee linear infinite',
        'reveal-item': 'reveal-item 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
