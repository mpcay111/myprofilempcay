import { Reveal } from '@/components/reveal';
import { Rule } from '@/components/rule';
import { Section } from '@/components/section';
import { SpecList, SpecRow } from '@/components/spec';
import { SpecValue } from '@/components/placeholder-text';
import { isPlaceholder } from '@/lib/placeholder';
import type { SiteContent } from '@/lib/content/schema';

/**
 * The closing section.
 *
 * The footer used to live here, on the reasoning that it only ever appears
 * under Contact. That stopped being true once section order became editable —
 * Contact can now sit anywhere, and a footer in the middle of the page is not
 * a footer. It is `SiteFooter` below, rendered by page.tsx after everything.
 *
 * There is deliberately no contact form. Nothing on this site has a backend,
 * and a form that silently drops a message is worse than no form at all.
 */
export function Contact({ content, index }: { content: SiteContent; index: string }) {
  const { email, identity, phone, showPhone, socials } = content;

  return (
    <>
      <Section
        id="contact"
        index={index}
        title="Contact"
        standfirst="No form to fill in and nothing between us — email reaches me directly."
      >
        <Reveal>
          <p className="label">Email</p>
          <a
            href={`mailto:${email}`}
            className="mt-4 inline-block max-w-full border-b border-border-strong pb-2 text-[clamp(1.25rem,4.2vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground transition-colors duration-200 [overflow-wrap:anywhere] hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
          >
            {email}
          </a>
        </Reveal>

        {/* The same rail as hero, work and the credentials footer — a reader
         * who has tracked that shape down the page meets it one last time.
         * Unframed: it is the bottom of the section, and a closing rule here
         * would read as a floor the footer then has to draw again.
         *
         * One Reveal around the whole rail rather than one per row: a `dl` may
         * only contain `dt`/`dd` or a single `div` layer wrapping them, and a
         * per-row wrapper would put a second div between the list and its
         * terms. */}
        <Reveal delay={0.05} className="mt-14 md:mt-16">
          <SpecList className="lg:max-w-md">
            {showPhone && (
              <SpecRow term="Phone">
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="border-b border-border-strong font-mono text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
                >
                  {phone}
                </a>
              </SpecRow>
            )}

            <SpecRow term="Based in">
              <span className="font-mono text-foreground">
                <SpecValue value={identity.location} />
              </span>
            </SpecRow>

            <SpecRow term="Availability">
              <span className="font-mono text-foreground">
                {identity.availableForWork ? 'Open to new roles' : 'Not actively looking'}
                {identity.availabilityNote && (
                  <span className="mt-2 block text-subtle">{identity.availabilityNote}</span>
                )}
              </span>
            </SpecRow>

            {socials.map((social) => (
              <SpecRow key={social.href} term={social.label}>
                {/* An unfilled href would send a visitor to a 404, so the handle
                 * renders as inert marked text until the URL is real. The
                 * marking stays on the handle because that is where a reader
                 * looks, but the tooltip names the field that is actually
                 * missing — the handle itself is finished. */}
                {isPlaceholder(social.href) ? (
                  <span
                    className="ph font-mono"
                    title="LinkedIn URL not set — fill socials[].href in content/profile.ts"
                  >
                    {social.handle}
                  </span>
                ) : (
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-b border-border-strong font-mono text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
                  >
                    {social.handle}
                  </a>
                )}
              </SpecRow>
            ))}
          </SpecList>
        </Reveal>
      </Section>

    </>
  );
}

/**
 * Rendered by page.tsx after every section, so it stays at the bottom no
 * matter how the sections are ordered.
 */
export function SiteFooter({ name }: { name: string }) {
  /* Evaluated once at build. Safe only because this is a server component —
   * the same call in a client component would eventually disagree with the
   * prerendered HTML and trip a hydration mismatch. */
  const year = new Date().getFullYear();

  return (
    <footer>
      <Rule />
      <div className="container-grid flex flex-col gap-4 py-8 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
        <p className="label text-muted">
          © {year} {name}
        </p>
        <p className="label sm:order-last">
          Next.js · TypeScript · Tailwind · Framer Motion
        </p>
        {/* "#top" resolves to the top of the document even with no element of
         * that id, so this holds whatever the hero is named. */}
        <a
          href="#top"
          className="label transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
