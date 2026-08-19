import { Section } from '@/components/section';
import { Reveal } from '@/components/reveal';
import { Rule } from '@/components/rule';
import { SpecList, SpecRow } from '@/components/spec';
import { SpecValue } from '@/components/placeholder-text';
import { realOnly } from '@/lib/placeholder';
import type { SiteContent } from '@/lib/content/schema';

/**
 * Two bands: the capability columns, then the credentials footer.
 *
 * The lists are plain lists rather than chips on purpose. A cloud of pills
 * reads as a keyword dump; a column with generous leading reads as someone
 * stating what they do.
 */
export function Expertise({ content }: { content: SiteContent }) {
  return (
    <Section
      id="expertise"
      index="04"
      title="Expertise"
      standfirst="What I work in, what I build with, and the commercial ground underneath both."
    >
      <div className="grid gap-12 lg:grid-cols-3 lg:gap-0">
        {content.expertise.map((group, groupIndex) => {
          const items = realOnly(group.items);

          return (
            <Reveal
              key={group.label}
              delay={groupIndex * 0.08}
              className={
                groupIndex === 0
                  ? 'lg:pr-8'
                  : 'lg:border-l lg:border-border lg:pl-8 lg:pr-8 lg:last:pr-0'
              }
            >
              <h3 className="label">{group.label}</h3>
              <ul
                role="list"
                className="mt-5 space-y-3 text-[0.9375rem] leading-[1.5] text-foreground md:text-base"
              >
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-16 md:mt-20">
        <Rule />
      </div>

      {/* Credentials footer — the datasheet block at the foot of the spec.
          Three single-pair rails side by side rather than one rail with three
          rows: at lg they have to sit on one line, and a shared divider drawn
          across a grid would rule between columns, not between rows. */}
      <Reveal delay={0.08}>
        <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Education carries the section's real weight: the CS degree is the
              reason the operations work above ships as software. It gets a
              vertical rule and the larger type — emphasis drawn in hairlines,
              like everything else here, rather than in a filled panel. */}
          <SpecList className="lg:col-span-6">
            <SpecRow term="Education">
              <ul role="list" className="space-y-4">
                {content.education.map((entry) => (
                  <li
                    key={`${entry.institution}-${entry.qualification}`}
                    className="border-l border-border-strong pl-6"
                  >
                    <p className="text-lg font-semibold leading-tight tracking-[-0.01em] text-foreground md:text-xl">
                      <SpecValue value={entry.qualification} />
                    </p>
                    <p className="mt-2 text-[0.9375rem] leading-[1.5] text-muted md:text-base">
                      <SpecValue value={entry.institution} />
                    </p>
                    <p className="label mt-4">
                      <SpecValue value={entry.period} />
                    </p>
                  </li>
                ))}
              </ul>
            </SpecRow>
          </SpecList>

          <SpecList className="lg:col-span-3">
            <SpecRow term="Certification">
              <ul
                role="list"
                className="space-y-2 text-[0.9375rem] leading-[1.5] text-foreground md:text-base"
              >
                {realOnly(content.certifications).map((certification) => (
                  <li key={certification}>{certification}</li>
                ))}
              </ul>
            </SpecRow>
          </SpecList>

          <SpecList className="lg:col-span-3">
            <SpecRow term="Languages">
              <ul
                role="list"
                className="space-y-2 text-[0.9375rem] leading-[1.5] text-foreground md:text-base"
              >
                {realOnly(content.languages).map((language) => (
                  <li key={language}>{language}</li>
                ))}
              </ul>
            </SpecRow>
          </SpecList>
        </div>
      </Reveal>
    </Section>
  );
}
