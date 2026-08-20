import type { ReactNode } from 'react';

/**
 * A very small inline markup, for emphasis inside prose.
 *
 *   **bold**        strong emphasis
 *   *italic*        light emphasis
 *   ==highlight==   the site's accent colour
 *   [label](url)    a link
 *
 * WHY NOT RICH TEXT. The obvious approach is to store HTML and render it with
 * dangerouslySetInnerHTML. That turns every content field into a script
 * injection point — and the admin writes to a database read by a public page,
 * so a single mistake there is a stored XSS on a site carrying someone's name.
 * This parser never produces HTML. It produces React elements, so there is
 * nothing to sanitise and nothing to get wrong: unrecognised syntax stays
 * literal text.
 *
 * The styling is fixed rather than author-chosen for the same reason the accent
 * list is curated — the palette is contrast-checked in both themes, and
 * arbitrary colours would quietly break that.
 */

const PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==|\[[^\]]+\]\([^)\s]+\))/g;

/**
 * Only an explicit http(s) URL.
 *
 * `javascript:` and `data:` are the obvious dangers — React renders whatever
 * href string it is handed, so raw HTML is not required for those to bite.
 * The scheme is also required to be written out: resolving against a base
 * would accept `//evil.com` as https, which means the stored text and the
 * actual destination disagree. What is typed should be what is linked.
 */
function safeHref(raw: string): string | null {
  if (!/^https?:\/\//i.test(raw)) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? raw : null;
  } catch {
    return null;
  }
}

export function renderInline(text: string): ReactNode {
  // Fast path for the common case. Note this checks for the *characters* that
  // could begin markup, not for a match: an earlier version short-circuited on
  // `parts.length === 1`, which silently broke any field consisting entirely of
  // one token — a fully bold description rendered as literal `**text**`.
  if (!/[*=[]/.test(text)) return text;

  const parts = text.split(PATTERN).filter((p) => p !== '');

  // Each branch re-tests the whole token rather than just its ends. A looser
  // check turned `****` — which the pattern never matched — into empty bold.
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (/^==[^=]+==$/.test(part)) {
      return (
        <span key={i} className="font-medium text-accent">
          {part.slice(2, -2)}
        </span>
      );
    }

    if (/^\*[^*]+\*$/.test(part)) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      // An unusable href degrades to plain text rather than a dead or
      // dangerous link.
      if (!href) return link[1];
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="border-b border-border-strong transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
        >
          {link[1]}
        </a>
      );
    }

    return part;
  });
}

/** True when the text contains any of the markup above — used by the admin to
 *  show a preview only when there is something to preview. */
export function hasInlineMarkup(text: string): boolean {
  PATTERN.lastIndex = 0;
  return PATTERN.test(text);
}
