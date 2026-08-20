import Image from 'next/image';
import { Section } from '@/components/section';
import { Reveal } from '@/components/reveal';
import { Copy } from '@/components/placeholder-text';
import type { SiteContent } from '@/lib/content/schema';

/**
 * The only long-form reading on the site, and deliberately the plainest block:
 * no spec rail, no standfirst. Everywhere else the page compresses; here it is
 * allowed to simply be read, so the prose starts immediately under the title.
 *
 * The portrait is optional and may be unset. The two-column split is
 * conditional rather than reserved — an empty image column beside 62ch of text
 * reads as a mistake — so setting `about.portrait` (a /public path or a Storage
 * URL) is the only edit needed to bring it in.
 */
export function About({
  content,
  index,
}: {
  content: SiteContent;
  index: string;
}) {
  const { portrait, paragraphs } = content.about;
  const { identity } = content;

  return (
    <Section id="about" index={index} title="About">
      <div className={portrait ? 'lg:grid lg:grid-cols-12 lg:gap-x-12' : undefined}>
        {portrait && (
          <Reveal className="lg:col-span-4">
            <figure className="max-w-[20rem] border border-border bg-surface lg:sticky lg:top-24 lg:max-w-none">
              <Image
                src={portrait}
                alt={`${identity.name}, ${identity.role}`}
                width={800}
                height={1000}
                sizes="(min-width: 1024px) 30vw, 20rem"
                className="h-auto w-full object-cover"
              />
            </figure>
          </Reveal>
        )}

        <div className={portrait ? 'mt-10 lg:col-span-8 lg:mt-0' : undefined}>
          {paragraphs.map((paragraph, i) => (
            <Reveal
              key={i}
              // Capped at three paragraphs of prose; the increment stays small
              // enough that the closing paragraph never lags behind the read.
              delay={Math.min(i, 3) * 0.08}
              className={i === 0 ? undefined : 'mt-7'}
            >
              <p
                className={
                  i === 0
                    ? 'max-w-prose text-[1.25rem] leading-[1.6] text-foreground'
                    : 'max-w-prose text-[1.0625rem] leading-[1.7] text-muted md:text-[1.125rem]'
                }
              >
                <Copy>{paragraph}</Copy>
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
