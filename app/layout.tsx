import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { getContent } from '@/lib/content/source';
import { themeBootScript } from '@/lib/theme';
import { orFallback } from '@/lib/placeholder';
import './globals.css';

/**
 * Inter carries the whole page. globals.css turns on `cv05` (the single-storey
 * lowercase l with a tail) which is what stops long runs of operations copy
 * from looking like default framework type.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

/** The register: section marks, spec-rail labels, figures, tags. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

/**
 * Metadata is generated rather than static because the name, role and statement
 * it is built from are now editable at runtime. Saving in the admin therefore
 * updates the page title and social card too, not just the visible copy.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { identity } = await getContent();

  const name = orFallback(identity.name, 'Portfolio');
  const role = orFallback(identity.role, 'Operations');
  const description = orFallback(
    identity.statement,
    'Operations leadership and the internal systems behind it.',
  );
  const title = `${name}${identity.credentials ? `, ${identity.credentials}` : ''} — ${role}`;

  return {
    metadataBase: new URL(identity.siteUrl),
    title: { default: title, template: `%s — ${name}` },
    description,
    applicationName: name,
    authors: [{ name }],
    creator: name,
    keywords: [
      'e-commerce operations',
      'operations director',
      'process improvement',
      'Lean Six Sigma',
      'Google Apps Script',
      'KPI management',
      'SOP development',
      name,
    ],
    alternates: { canonical: identity.siteUrl },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'profile',
      locale: 'en_US',
      url: identity.siteUrl,
      siteName: name,
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#101519' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { theme } = await getContent();

  return (
    // suppressHydrationWarning because the boot script below mutates this
    // element's class before React hydrates. That divergence is the point of
    // the script, not a bug, and it is confined to this one attribute.
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint. Anything deferred would let the browser
            paint the wrong palette first, so a visitor who chose dark gets a
            white flash on every navigation. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript(theme) }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-none focus:border focus:border-border-strong focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
