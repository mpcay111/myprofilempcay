import type { ReactNode } from 'react';
import { Rule } from '@/components/rule';
import { SectionSpine } from '@/components/section-spine';

type SectionProps = {
  id: string;
  /** Zero-padded index, e.g. "02". */
  index: string;
  title: string;
  /** Optional short line under the section title. */
  standfirst?: string;
  children: ReactNode;
};

/**
 * Every section shares one structure: a full-bleed hairline, then a reserved
 * two-column gutter at lg carrying the monospace register (index, section mark)
 * on a vertical rule, with content always beginning at column 3.
 *
 * That gutter is what makes six structurally unlike sections read as one
 * document. Below lg it collapses into a single horizontal mono line, which
 * keeps the information without pretending the column still exists.
 */
export function Section({ id, index, title, standfirst, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <Rule />

      <div className="container-grid py-24 md:py-32 lg:py-40">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Index gutter — the spine. Its own component because it is a client
              component (it reads which section is current) while this shell
              stays a server component. */}
          <SectionSpine id={id} index={index} title={title} />

          {/* Content well. */}
          <div className="mt-8 lg:col-span-10 lg:mt-0">
            <h2 className="max-w-[20ch] text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
              {title}
            </h2>
            {standfirst && (
              <p className="mt-5 max-w-prose text-[1.0625rem] leading-[1.6] text-muted md:text-[1.125rem]">
                {standfirst}
              </p>
            )}
            <div className="mt-12 md:mt-16">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
