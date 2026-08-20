'use client';

import { useState } from 'react';
import { renderInline } from '@/lib/inline';

/**
 * A collapsed reference for the inline markup.
 *
 * Formatting nobody knows about does not exist, and the alternative — putting a
 * toolbar above every one of the forty-odd text fields — would bury the content
 * under chrome. One reference, opened once, is enough for four rules.
 *
 * Each example renders itself through the real parser, so what is shown here
 * cannot drift from what the page will do.
 */

const EXAMPLES = [
  ['**bold**', 'For a phrase that has to land.'],
  ['*italic*', 'Lighter emphasis, or a term being introduced.'],
  ['==highlight==', "Sets the phrase in the site's accent colour. Use it rarely."],
  ['[link text](https://example.com)', 'Opens in a new tab.'],
] as const;

export function FormattingHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="formatting-help"
        className="label transition-colors hover:text-foreground focus-visible:text-foreground"
      >
        {open ? '− ' : '+ '}Text formatting
      </button>

      {open && (
        <div id="formatting-help" className="mt-4 max-w-prose">
          <p className="text-[0.875rem] leading-[1.5] text-muted">
            These work in any paragraph, description, or bullet — the statement,
            project write-ups, experience highlights, About, and scope
            descriptions. Anything else you type stays exactly as written.
          </p>

          <dl className="mt-5 divide-y divide-border border-y border-border">
            {EXAMPLES.map(([syntax, note]) => (
              <div key={syntax} className="grid gap-2 py-3 sm:grid-cols-12 sm:gap-4">
                <dt className="font-mono text-[0.8125rem] text-foreground sm:col-span-4">
                  {syntax}
                </dt>
                <dd className="text-[0.875rem] leading-[1.5] text-muted sm:col-span-8">
                  <span className="text-foreground">{renderInline(syntax)}</span>
                  <span className="mt-1 block text-subtle">{note}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-[0.8125rem] leading-[1.45] text-subtle">
            Colours and typefaces are set once for the whole site under Identity
            → Appearance, rather than per word. Every option there is checked to
            stay readable in both light and dark, which a free colour picker
            could not guarantee.
          </p>
        </div>
      )}
    </div>
  );
}
