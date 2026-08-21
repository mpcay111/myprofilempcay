import { Rule } from '@/components/rule';
import { Reveal } from '@/components/reveal';
import { SpecList, SpecRow } from '@/components/spec';
import { Copy } from '@/components/placeholder-text';
import type { ServicesContent, ServiceItem } from '@/lib/content/schema';

/**
 * The /services page body.
 *
 * This is a page rather than a section, so it opens with an <h1> and each
 * service is an <h2> — on the one-pager those levels belong to the site title
 * and the section headings respectively, and reusing <Section> here would have
 * produced a page whose first heading was an <h2> with no <h1> above it.
 *
 * Everything else is deliberately the same furniture as the one-pager: the
 * two-column mono gutter, the hairline rules, the spec rail. A visitor
 * arriving here from the menu should not feel they have left the site, and the
 * quickest way to break that is to invent a second layout system for one page.
 */

function Service({ service, index }: { service: ServiceItem; index: string }) {
  /* Both rail values are optional and the rail should not render as an empty
     framed box when neither is set. */
  const hasRail = Boolean(service.audience || service.format);

  return (
    <article>
      <Rule />

      <div className="container-grid py-16 md:py-20 lg:py-24">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Index gutter — the spine, same device as every section on the
              home page. Decorative: the <h2> below is the real heading, so
              announcing "01, section Fractional COO" first just doubles it. */}
          <div className="lg:col-span-2">
            <div
              aria-hidden="true"
              className="flex items-baseline gap-3 lg:sticky lg:top-24 lg:block lg:border-l lg:border-border lg:pl-4"
            >
              <span className="label text-accent">{index}</span>
              <span className="label lg:mt-3 lg:block">§ {service.title}</span>
            </div>
            <div className="mt-4 lg:hidden">
              <Rule />
            </div>
          </div>

          <div className="mt-8 lg:col-span-10 lg:mt-0">
            <Reveal>
              <h2 className="max-w-[22ch] text-[clamp(1.5rem,2.6vw,2.25rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
                {service.title}
              </h2>

              {service.promise && (
                <p className="mt-5 max-w-prose text-[1.0625rem] leading-[1.6] text-muted md:text-[1.125rem]">
                  <Copy>{service.promise}</Copy>
                </p>
              )}

              {service.deliverables.length > 0 && (
                /* Real discs, indented — matching the experience lists. A
                   run of these reads faster than a run of dashes, and
                   `marker:` keeps the dot off the text colour so it stays
                   punctuation rather than content. */
                <ul
                  role="list"
                  className="mt-7 max-w-prose list-disc space-y-3 pl-5 marker:text-border-strong"
                >
                  {service.deliverables.map((line, i) => (
                    <li key={i} className="text-[1rem] leading-[1.6] text-foreground/90">
                      <Copy>{line}</Copy>
                    </li>
                  ))}
                </ul>
              )}

              {hasRail && (
                <SpecList framed className="mt-10 max-w-xl">
                  {service.audience && (
                    <SpecRow term="For">
                      <Copy>{service.audience}</Copy>
                    </SpecRow>
                  )}
                  {service.format && (
                    <SpecRow term="Engagement">
                      <Copy>{service.format}</Copy>
                    </SpecRow>
                  )}
                </SpecList>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Services({
  services,
  email,
}: {
  services: ServicesContent;
  /** Only the address, not the whole contact block — see SiteHeader's note. */
  email: string;
}) {
  const showCta = Boolean(services.ctaHeading || services.ctaBody);

  return (
    <>
      {/* Page head. No leading <Rule>: the logo bar or the header already
          closes the top of the page, and a second hairline under it reads as
          a mistake. */}
      <div className="container-grid pb-4 pt-16 md:pt-24 lg:pt-28">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-2">
            <span className="label text-accent" aria-hidden="true">
              §
            </span>
          </div>
          <div className="mt-6 lg:col-span-10 lg:mt-0">
            <h1 className="max-w-[18ch] text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
              {services.title}
            </h1>
            {services.intro && (
              <p className="mt-6 max-w-prose text-[1.125rem] leading-[1.6] text-muted md:text-[1.1875rem]">
                <Copy>{services.intro}</Copy>
              </p>
            )}
          </div>
        </div>
      </div>

      {services.items.map((service, i) => (
        <Service
          key={`${service.title}-${i}`}
          service={service}
          index={String(i + 1).padStart(2, '0')}
        />
      ))}

      {showCta && (
        <>
          <Rule />
          <div className="container-grid py-20 md:py-24">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
              <div className="lg:col-span-2">
                <span className="label" aria-hidden="true">
                  § Next
                </span>
              </div>
              <div className="mt-6 lg:col-span-10 lg:mt-0">
                <Reveal>
                  {services.ctaHeading && (
                    <h2 className="max-w-[24ch] text-[clamp(1.5rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.025em]">
                      <Copy>{services.ctaHeading}</Copy>
                    </h2>
                  )}
                  {services.ctaBody && (
                    <p className="mt-5 max-w-prose text-[1.0625rem] leading-[1.6] text-muted">
                      <Copy>{services.ctaBody}</Copy>
                    </p>
                  )}
                  <p className="mt-8">
                    <a
                      href={`mailto:${email}`}
                      className="label border-b border-border-strong pb-1 transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
                    >
                      {email} <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </Reveal>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
