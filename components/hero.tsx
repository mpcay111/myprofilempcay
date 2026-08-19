import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { Rule } from '@/components/rule';
import { Copy, SpecValue } from '@/components/placeholder-text';
import { SpecList, SpecRow } from '@/components/spec';
import { realOnly } from '@/lib/placeholder';
import { yearsOfExperience } from '@/lib/career';
import type { SiteContent } from '@/lib/content/schema';

/**
 * The opening screen.
 *
 * It borrows the Section shell's grid rather than re-inventing one: the same
 * two-column mono gutter on the left, content starting at column 3. The hero is
 * not a Section — it has no standfirst and no rule above it — but it has to sit
 * on the same spine or the document loses its structure at the very top.
 *
 * Deliberately no `Reveal` here. Reveal's hidden variant is present in the
 * server-rendered markup, so anything wrapped in it is invisible until framer
 * hydrates. That is an acceptable trade below the fold and an unacceptable one
 * above it. The Rules still draw themselves, which is enough motion to say the
 * page is alive.
 */
export function Hero({ content }: { content: SiteContent }) {
  const { identity, email, projects } = content;

  // Whole years since he started on the front line, counted month-aware so the
  // figure never overstates against the statement paragraph beside it. Hero is
  // a server component, so this is evaluated at build time — never in a client
  // render, where it could disagree with the server's HTML.
  const yearsExperience = yearsOfExperience(content.careerStartYear, content.careerStartMonth);

  const disciplines = realOnly(identity.disciplines);

  // Optional, and null in the default content. Everything the image brings with
  // it — the stacking context, the scrim, the layer itself — is conditional, so
  // with no image the hero is the plain paper ground it has always been.
  const backgroundImage = identity.backgroundImage;

  return (
    <section id="top" className={backgroundImage ? 'relative isolate scroll-mt-20' : 'scroll-mt-20'}>
      {backgroundImage && (
        /* Decorative: it carries no information the copy does not already
           state, so it is hidden from the accessibility tree entirely.

           `isolate` on the section keeps the negative z-index inside this
           subtree — without it the layer would sink behind the page ground and
           disappear. The scrim is the site's own ground colour at high alpha,
           so it inverts with the palette and the muted body copy keeps its
           contrast in both. */
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <Image
            src={backgroundImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-background/85" />
        </div>
      )}
      <div className="container-grid pb-20 pt-24 sm:pt-28 md:pb-24 lg:pb-32 lg:pt-36">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* The spine — same construction as Section's index gutter. */}
          <div className="lg:col-span-2">
            <div className="flex items-baseline gap-3 lg:sticky lg:top-24 lg:block lg:border-l lg:pl-4">
              <span className="label text-accent" aria-hidden="true">
                00
              </span>
              <span className="label lg:mt-3 lg:block" aria-hidden="true">
                § Profile
              </span>
            </div>
            <div className="mt-4 lg:hidden">
              <Rule />
            </div>
          </div>

          {/* Content well. */}
          <div className="mt-8 lg:col-span-10 lg:mt-0">
            <div className="lg:grid lg:grid-cols-10 lg:gap-x-8">
              {(() => {
                /* The name is the largest type on the page and already wraps at
                   desktop width. Standing a photo beside it takes ~130px out of
                   that measure, which would push it to three lines — so the
                   clamp is scaled back only when a photo is actually present.
                   With no photo the original size and markup are unchanged. */
                const nameSize = identity.photo
                  ? 'text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[0.94] tracking-[-0.035em]'
                  : 'text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.04em]';

                const nameBlock = (
                  <>
                <h1 className={nameSize}>
                  {identity.name}
                  {identity.credentials && (
                    /* `align-top` pins the post-nominal to the top of the line
                       box, which lands it on the name's cap line at every size
                       in the clamp — and still follows the last word cleanly
                       when the name wraps.

                       Size and colour are overridden off `.label` rather than
                       replacing it: the post-nominal has to scale with the h1
                       across its whole clamp range, and a fixed 11px label
                       would detach from the name at the large end. Utilities
                       outrank the components layer, so the class still carries
                       the register. */
                    <span className="label ml-2 align-top text-[clamp(0.6875rem,1vw,0.875rem)] text-accent sm:ml-3">
                      {identity.credentials}
                    </span>
                  )}
                </h1>

                <p className="mt-6 text-[1.25rem] font-medium tracking-[-0.01em] text-foreground sm:text-[1.5rem]">
                  {identity.role}
                </p>
              </>
            );

            return (
              <div className="lg:col-span-7">
                {identity.photo ? (
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-7">
                    {/* Square with a hairline, not a circle: the availability
                        dot is the only rounded thing on this site, and a round
                        avatar would read as a social profile rather than a
                        document.

                        alt is empty on purpose — the name is immediately
                        beside it, and describing the photo would make a screen
                        reader announce the same person twice. */}
                    <div className="shrink-0 self-start border border-border bg-surface">
                      <Image
                        src={identity.photo}
                        alt=""
                        width={480}
                        height={480}
                        priority
                        sizes="(min-width: 640px) 128px, 96px"
                        className="h-24 w-24 object-cover sm:h-32 sm:w-32"
                      />
                    </div>
                    <div className="min-w-0">{nameBlock}</div>
                  </div>
                ) : (
                  nameBlock
                )}

                {disciplines.length > 0 && (
                  <ul role="list" className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                    {disciplines.map((discipline, i) => (
                      <li key={discipline} className="flex items-center gap-x-3">
                        {i > 0 && (
                          <span
                            className="h-px w-4 bg-border-strong"
                            aria-hidden="true"
                          />
                        )}
                        <span className="label">{discipline}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-8 max-w-narrative text-[1.125rem] leading-[1.65] text-muted md:text-[1.1875rem]">
                  <Copy>{identity.statement}</Copy>
                </p>

                {/* Availability is off in the content file today. Everything
                    here is gap-driven rather than margin-driven, so when the
                    badge is absent the row simply has two children. */}
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 md:mt-12">
                  {/* The primary call to action carries its emphasis in weight
                      and in the underline, not in colour. Accent is reserved
                      for the hover and focus state here exactly as it is on
                      every other control on the site — a control that starts
                      accent and loses it on hover reads as going dead. */}
                  <a
                    href="#work"
                    className="inline-flex items-baseline gap-2 border-b border-border-strong pb-2 text-[0.9375rem] font-medium text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
                  >
                    Selected work
                    <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>

                  <a
                    href={`mailto:${email}`}
                    className="break-all border-b border-border-strong pb-2 font-mono text-[0.875rem] text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent sm:text-[0.9375rem]"
                  >
                    {email}
                  </a>

                  {identity.availableForWork && (
                    <p className="inline-flex items-center gap-2.5 border border-border-strong px-3 py-2">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      <span className="label text-foreground">Available for work</span>
                      {identity.availabilityNote && (
                        <span className="label normal-case tracking-normal">
                          {identity.availabilityNote}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
                );
              })()}

              {/* The spec block — the datasheet idea, stated on arrival.
                  Figures are derived, never typed: the systems count follows
                  the content document and the years figure follows the clock.

                  It is the shared rail, single-column at every width. It used
                  to break into a two-up grid below lg, but the rail's whole
                  value is that the reader tracks one shape down the page, and
                  a grid turns its dividers into stray part-width rules. */}
              <div className="mt-14 lg:col-span-3 lg:mt-0 lg:pt-4">
                <div className="mb-8 lg:hidden">
                  <Rule />
                </div>

                {/* Unframed: the rail is the bottom of this column, so a
                    closing rule would read as a false floor under the page. */}
                <SpecList className="lg:border-l lg:pl-6">
                  <SpecRow term="Experience">
                    <span className="font-mono text-[1.875rem] font-medium leading-none tracking-[-0.02em] text-foreground">
                      {String(yearsExperience).padStart(2, '0')}
                      <span className="label ml-1.5">yrs</span>
                    </span>
                  </SpecRow>

                  <SpecRow term="Systems built">
                    <span className="font-mono text-[1.875rem] font-medium leading-none tracking-[-0.02em] text-foreground">
                      {String(projects.length).padStart(2, '0')}
                    </span>
                  </SpecRow>

                  <SpecRow term="Based in">
                    <span className="font-mono text-[0.875rem] leading-[1.45] text-foreground">
                      <SpecValue value={identity.location} />
                    </span>
                  </SpecRow>
                </SpecList>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
